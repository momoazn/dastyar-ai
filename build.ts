#!/usr/bin/env bun

import { execSync } from "node:child_process";
import {
  copyFileSync,
  cpSync,
  existsSync,
  promises as fsPromises,
  mkdirSync,
  readdirSync,
  statSync,
} from "node:fs";
import { dirname, isAbsolute, join } from "node:path";
import {
  collectOfflineModelIds,
  resolveConfiguredPath,
  env as serverEnv,
} from "./apps/server/src/config";

const ROOT_DIR = process.cwd();
const DIST_DIR = join(ROOT_DIR, "dist");
const SERVER_DIR = join(ROOT_DIR, "apps", "server");
const WEB_DIR = join(ROOT_DIR, "apps", "web");

type BuildPlatform = "host" | "windows";

const parseBuildPlatform = (): BuildPlatform => {
  const envPlatform = process.env.BUILD_PLATFORM?.toLowerCase();
  if (envPlatform === "windows") {
    return "windows";
  }

  const args = process.argv.slice(2);
  for (let idx = 0; idx < args.length; idx += 1) {
    const arg = args[idx];
    if (arg === "--platform" && idx + 1 < args.length) {
      const next = args[idx + 1]?.toLowerCase();
      if (next === "windows") {
        return "windows";
      }
    } else if (arg.startsWith("--platform=")) {
      const value = arg.split("=", 2)[1]?.toLowerCase();
      if (value === "windows") {
        return "windows";
      }
    }
  }

  return "host";
};

const ensureDir = (dirPath: string): void => {
  if (!existsSync(dirPath)) {
    mkdirSync(dirPath, { recursive: true });
  }
};

const safeCopyDir = (srcDir: string, destDir: string): void => {
  if (!existsSync(srcDir)) {
    return;
  }
  ensureDir(destDir);
  cpSync(srcDir, destDir, { recursive: true, force: true });
};

const safeCopyFile = (srcFile: string, destFile: string): void => {
  if (!existsSync(srcFile)) {
    return;
  }
  // Do not overwrite existing destination
  if (existsSync(destFile)) {
    return;
  }
  ensureDir(dirname(destFile));
  copyFileSync(srcFile, destFile);
};

const copyFileIfExists = (src: string, dest: string): void => {
  if (!existsSync(src)) {
    return;
  }
  copyFileSync(src, dest);
};

const parseBooleanEnv = (value: string | undefined, defaultValue = false) => {
  if (value === undefined) {
    return defaultValue;
  }
  const normalized = value.trim().toLowerCase();
  if (["1", "true", "yes", "on"].includes(normalized)) {
    return true;
  }
  if (["0", "false", "no", "off"].includes(normalized)) {
    return false;
  }
  return defaultValue;
};

const skipOfflineModelDownloads =
  parseBooleanEnv(process.env.SKIP_OFFLINE_MODEL_DOWNLOADS) ||
  parseBooleanEnv(process.env.SKIP_MODEL_DOWNLOADS);

const resolveDistPath = (
  configuredPath: string,
  fallbackRelative: string
): string => {
  if (isAbsolute(configuredPath)) {
    console.warn(
      `[build] Ignoring absolute configured path "${configuredPath}", using "./${fallbackRelative}" within dist`
    );
    return join(DIST_DIR, fallbackRelative);
  }
  return resolveConfiguredPath(configuredPath, DIST_DIR);
};

const findTransformersWasmDir = (workspaceRoot: string): string | null => {
  const bunNm = join(workspaceRoot, "node_modules", ".bun");
  if (!existsSync(bunNm)) {
    return null;
  }
  const entries = readdirSync(bunNm)
    .filter((n) => n.startsWith("@huggingface+transformers@"))
    .sort()
    .reverse();
  for (const ent of entries) {
    const wasmDir = join(
      bunNm,
      ent,
      "node_modules",
      "@huggingface",
      "transformers",
      "dist"
    );
    if (existsSync(wasmDir)) {
      return wasmDir;
    }
  }
  return null;
};

// --------------------
// Robust model downloader (concurrency, retries, size checks)
// --------------------

const numFromEnv = (name: string, def: number): number => {
  const raw = process.env[name];
  if (!raw) {
    return def;
  }
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : def;
};

const DOWNLOAD_CONCURRENCY = numFromEnv("MODEL_DOWNLOAD_CONCURRENCY", 6);
const DOWNLOAD_RETRIES = numFromEnv("MODEL_DOWNLOAD_RETRIES", 4);
const DOWNLOAD_TIMEOUT_MS = numFromEnv("MODEL_DOWNLOAD_TIMEOUT_MS", 90_000);
const HF_TOKEN =
  process.env.HF_TOKEN || process.env.HUGGINGFACE_HUB_TOKEN || "";

const defaultHeaders: HeadersInit = HF_TOKEN
  ? { Authorization: `Bearer ${HF_TOKEN}` }
  : {};

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// (no-op placeholder removed)

const fetchWithRetry = async (
  url: string,
  init: RequestInit = {},
  retries = DOWNLOAD_RETRIES,
  timeoutMs = DOWNLOAD_TIMEOUT_MS
): Promise<Response> => {
  let attempt = 0;
  let lastError: unknown;
  while (attempt <= retries) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      const headers = {
        ...(init.headers || {}),
        ...defaultHeaders,
      } as HeadersInit;
      const resp = await fetch(url, {
        ...init,
        headers,
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (resp.ok) {
        return resp;
      }
      const retriable = resp.status >= 500 || resp.status === 429;
      if (!retriable) {
        return resp;
      }
      lastError = new Error(`HTTP ${resp.status}`);
    } catch (err) {
      lastError = err;
    }
    const backoff = Math.min(2000 * 2 ** attempt, 20_000) + Math.random() * 200;
    await sleep(backoff);
    attempt += 1;
  }
  throw lastError instanceof Error
    ? lastError
    : new Error("Fetch failed after retries");
};

const remoteUrlFor = (modelId: string, file: string): string =>
  `https://huggingface.co/${modelId}/resolve/main/${file}`;

const headRemoteSize = async (url: string): Promise<number | null> => {
  try {
    const r = await fetchWithRetry(url, { method: "HEAD" }, 1, 15_000);
    const len = r.headers.get("content-length");
    if (len) {
      const n = Number(len);
      if (Number.isFinite(n)) {
        return n;
      }
    }
  } catch {
    // Ignore errors when checking remote file size
  }
  return null;
};

const fileSize = (p: string): number | null => {
  try {
    return statSync(p).size;
  } catch {
    return null;
  }
};

const ensureDownloaded = async (
  url: string,
  dest: string
): Promise<boolean> => {
  ensureDir(dirname(dest));
  const expected = await headRemoteSize(url);
  const existing = existsSync(dest) ? fileSize(dest) : null;
  if (expected != null && existing != null && existing === expected) {
    return false; // already present and complete
  }
  const tmp = `${dest}.partial-${Date.now()}`;
  const resp = await fetchWithRetry(url, { method: "GET" });
  if (!resp.ok) {
    throw new Error(`GET ${url} -> ${resp.status}`);
  }
  await Bun.write(tmp, resp);
  const finalSize = fileSize(tmp);
  if (expected != null && finalSize != null && expected !== finalSize) {
    throw new Error(
      `Size mismatch for ${url}: got ${finalSize}, expected ${expected}`
    );
  }
  await fsPromises.rename(tmp, dest);
  return true;
};

const limitPool = async <T, R>(
  items: T[],
  limit: number,
  worker: (item: T, index: number) => Promise<R>
): Promise<R[]> => {
  const results: R[] = [];
  let i = 0;
  const run = async (): Promise<void> => {
    while (true) {
      const idx = i;
      if (idx >= items.length) {
        return;
      }
      i += 1;
      const r = await worker(items[idx], idx);
      results[idx] = r;
    }
  };
  const runners = Array.from({ length: Math.min(limit, items.length) }, run);
  await Promise.all(runners);
  return results;
};

const listNeededFiles = async (modelId: string): Promise<string[]> => {
  const apiUrl = `https://huggingface.co/api/models/${modelId}`;
  const res = await fetchWithRetry(apiUrl, { method: "GET" }, 3, 25_000);
  if (!res.ok) {
    throw new Error(`Failed to query hub for ${modelId}: ${res.status}`);
  }
  const json = (await res.json()) as {
    siblings?: Array<{ rfilename: string }>;
  };
  const siblings = json.siblings ?? [];
  if (siblings.length === 0) {
    throw new Error(`No files listed for ${modelId}`);
  }
  const wanted = new Set<string>([
    "config.json",
    "tokenizer.json",
    "tokenizer_config.json",
    "preprocessor_config.json",
    "special_tokens_map.json",
    "vocab.json",
    "merges.txt",
    "generation_config.json",
    "added_tokens.json",
  ]);
  for (const s of siblings) {
    if (s.rfilename.startsWith("onnx/")) {
      // include all ONNX assets (multiple shards possible)
      wanted.add(s.rfilename);
    }
  }
  if (!Array.from(wanted).some((f) => f.endsWith(".onnx"))) {
    wanted.add("onnx/model.onnx");
  }
  return Array.from(wanted);
};

const downloadModelRepo = async (
  modelId: string,
  outDir: string
): Promise<void> => {
  const files = await listNeededFiles(modelId);
  const started = Date.now();
  console.log(`📥 Prefetching ${modelId} (${files.length} files)...`);
  let downloaded = 0;
  const tasks = files.map((rel) => async () => {
    const url = remoteUrlFor(modelId, rel);
    const dest = join(outDir, modelId, rel);
    const wrote = await ensureDownloaded(url, dest);
    if (wrote) {
      downloaded += 1;
    }
  });
  // bounded parallelism
  await limitPool(tasks, DOWNLOAD_CONCURRENCY, (t) => t());
  const took = Date.now() - started;
  console.log(
    `✅ ${modelId}: ${downloaded} downloaded, ${
      files.length - downloaded
    } cached (${Math.round(took / 1000)}s)`
  );
};

const main = async (): Promise<void> => {
  console.log("🚀 Building Dastyar AI...");

  const buildPlatform = parseBuildPlatform();
  const serverBuildCommand =
    buildPlatform === "windows" ? "bun run build:windows" : "bun run build";
  const serverTargetLabel =
    buildPlatform === "windows"
      ? "bun-windows-x64"
      : `native (${process.platform})`;

  // Create root dist directory
  ensureDir(DIST_DIR);

  // Build server
  console.log(`📦 Building server (target: ${serverTargetLabel})...`);
  execSync(serverBuildCommand, { cwd: SERVER_DIR, stdio: "inherit" });

  // Copy .env.example to dist/
  safeCopyFile(
    join(SERVER_DIR, ".env.example"),
    join(DIST_DIR, ".env.example")
  );

  // Build web
  console.log("🌐 Building web...");
  execSync("bun run build", { cwd: WEB_DIR, stdio: "inherit" });

  // Copy server output into dist/
  const serverOut = join(SERVER_DIR, "dist");
  console.log("📋 Copying server artifacts...");
  safeCopyDir(serverOut, DIST_DIR);

  // Copy web output into dist/web
  const webOut = join(WEB_DIR, "dist");
  const webTarget = resolveDistPath(serverEnv.WEB_DIST_DIR, "web");
  console.log("📋 Copying web artifacts...");
  safeCopyDir(webOut, webTarget);

  // Optional convenience copies if present in workspace
  // - Root config.json -> dist/config.json (server reads from exec dir)
  safeCopyFile(join(ROOT_DIR, "config.json"), join(DIST_DIR, "config.json"));
  // - apps/server/whisper-models -> dist/whisper-models (if user pre-fetched)
  safeCopyDir(
    join(SERVER_DIR, "whisper-models"),
    join(DIST_DIR, "whisper-models")
  );

  // Prepare minimal offline assets
  console.log("🤖 Preparing offline assets...");
  const wasmOut = join(DIST_DIR, "wasm");
  const modelsOut = resolveDistPath(
    serverEnv.WHISPER_MODELS_DIR,
    "whisper-models"
  );
  const cacheOut = resolveDistPath(
    serverEnv.WHISPER_CACHE_DIR,
    ".whisper-cache"
  );
  ensureDir(wasmOut);
  ensureDir(modelsOut);
  ensureDir(cacheOut);

  const wasmSrcDir = findTransformersWasmDir(ROOT_DIR);
  if (wasmSrcDir) {
    const files = readdirSync(wasmSrcDir);
    for (const file of files) {
      if (file.endsWith(".wasm")) {
        const destFile = join(wasmOut, file);
        if (!existsSync(destFile)) {
          copyFileIfExists(join(wasmSrcDir, file), destFile);
        }
      }
    }
  }

  const modelIds = collectOfflineModelIds();

  if (skipOfflineModelDownloads) {
    console.log(
      "⚠️  Skipping offline model downloads (SKIP_OFFLINE_MODEL_DOWNLOADS set)."
    );
  } else if (modelIds.length > 0) {
    const modelTasks = modelIds.map((modelId) => async () => {
      await downloadModelRepo(modelId, modelsOut);
    });
    const errors: string[] = [];
    await limitPool(modelTasks, Math.min(3, modelTasks.length), async (t) => {
      try {
        await t();
        return "ok" as const;
      } catch (err) {
        errors.push(String(err));
        return "err" as const;
      }
    });
    if (errors.length > 0) {
      console.warn(
        [
          "⚠️  Failed to prefetch some offline models.",
          "   • Production runs will fail if required files are missing.",
          "   • Development can still download on demand.",
          ...errors.map((msg) => `   • ${msg}`),
          "   Set SKIP_OFFLINE_MODEL_DOWNLOADS=1 to silence this during offline CI builds.",
        ].join("\n")
      );
    }
  }

  console.log("✅ Done. Artifacts available in ./dist");
};

main().catch((err) => {
  console.error("Build failed:", err);
  process.exit(1);
});
