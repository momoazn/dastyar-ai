#!/usr/bin/env bun

import { execSync } from "node:child_process";
import {
  copyFileSync,
  cpSync,
  existsSync,
  promises as fsPromises,
  mkdirSync,
  readdirSync,
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

const writeFileAtomic = async (
  dest: string,
  data: Uint8Array
): Promise<void> => {
  const tmp = `${dest}.tmp-${Date.now()}`;
  await fsPromises.writeFile(tmp, data);
  await fsPromises.rename(tmp, dest);
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

const downloadModelRepo = async (
  modelId: string,
  outDir: string
): Promise<void> => {
  const apiUrl = `https://huggingface.co/api/models/${modelId}`;
  const res = await fetch(apiUrl);
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
  ]);
  for (const s of siblings) {
    if (s.rfilename.startsWith("onnx/") && s.rfilename.endsWith(".onnx")) {
      wanted.add(s.rfilename);
    }
  }
  if (!Array.from(wanted).some((f) => f.endsWith(".onnx"))) {
    wanted.add("onnx/model.onnx");
  }
  const tasks: Promise<void>[] = [];
  for (const s of siblings) {
    if (!wanted.has(s.rfilename)) {
      continue;
    }
    const url = `https://huggingface.co/${modelId}/resolve/main/${s.rfilename}`;
    const dest = join(outDir, modelId, s.rfilename);
    ensureDir(dirname(dest));
    tasks.push(
      (async () => {
        const r = await fetch(url);
        if (!r.ok) {
          throw new Error(`GET ${url} -> ${r.status}`);
        }
        const buf = new Uint8Array(await r.arrayBuffer());
        await writeFileAtomic(dest, buf);
      })()
    );
  }
  await Promise.all(tasks);
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
    const downloadResults = await Promise.allSettled(
      modelIds.map(async (modelId) => {
        const modelDir = join(modelsOut, modelId);
        if (existsSync(modelDir)) {
          return;
        }
        await downloadModelRepo(modelId, modelsOut);
      })
    );
    type RejectedDownload = Extract<
      PromiseSettledResult<void>,
      { status: "rejected" }
    >;
    const failedDownloads = downloadResults.filter(
      (result): result is RejectedDownload => result.status === "rejected"
    );
    if (failedDownloads.length > 0) {
      console.warn(
        [
          "⚠️  Failed to prefetch some offline models. They will need to be downloaded at runtime:",
          ...failedDownloads.map((entry) => `   • ${entry.reason}`),
          "   Set SKIP_OFFLINE_MODEL_DOWNLOADS=1 to silence this warning during builds without network access.",
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
