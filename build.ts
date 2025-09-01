#!/usr/bin/env bun

import { execSync } from 'node:child_process';
import {
  copyFileSync,
  cpSync,
  existsSync,
  promises as fsPromises,
  mkdirSync,
  readdirSync,
} from 'node:fs';
import { dirname, join } from 'node:path';

const ROOT_DIR = process.cwd();
const DIST_DIR = join(ROOT_DIR, 'dist');
const SERVER_DIR = join(ROOT_DIR, 'apps', 'server');
const WEB_DIR = join(ROOT_DIR, 'apps', 'web');

// Helper functions for offline preparation
const mkdirp = (dirPath: string) => {
  if (existsSync(dirPath)) {
    console.log(`[mkdirp] Directory already exists: ${dirPath}`);
  } else {
    console.log(`[mkdirp] Creating directory: ${dirPath}`);
    mkdirSync(dirPath, { recursive: true });
  }
};

const writeFileAtomic = async (dest: string, data: Uint8Array) => {
  const tmp = `${dest}.tmp-${Date.now()}`;
  console.log(`[writeFileAtomic] Writing temporary file: ${tmp}`);
  await fsPromises.writeFile(tmp, data);
  await fsPromises.rename(tmp, dest);
  console.log(`[writeFileAtomic] Renamed ${tmp} to ${dest}`);
};

const copyFileIfExists = (src: string, dest: string) => {
  if (existsSync(src)) {
    console.log(`[copyFileIfExists] Copying file from ${src} to ${dest}`);
    copyFileSync(src, dest);
  } else {
    console.log(`[copyFileIfExists] Source file does not exist: ${src}`);
  }
};

const findTransformersWasmDir = (workspaceRoot: string): string | null => {
  // Bun vendors packages under node_modules/.bun/<name@version>/node_modules/<name>
  const bunNm = join(workspaceRoot, 'node_modules', '.bun');
  if (!existsSync(bunNm)) {
    console.log(
      `[findTransformersWasmDir] .bun directory not found at ${bunNm}`
    );
    return null;
  }
  const entries = readdirSync(bunNm)
    .filter((n) => n.startsWith('@huggingface+transformers@'))
    .sort()
    .reverse();
  console.log(
    `[findTransformersWasmDir] Found transformer entries: ${entries.join(', ')}`
  );
  for (const ent of entries) {
    const wasmDir = join(
      bunNm,
      ent,
      'node_modules',
      '@huggingface',
      'transformers',
      'dist'
    );
    if (existsSync(wasmDir)) {
      console.log(`[findTransformersWasmDir] Found WASM directory: ${wasmDir}`);
      return wasmDir;
    }
  }
  console.log('[findTransformersWasmDir] No WASM directory found');
  return null;
};

const downloadModelRepo = async (
  modelId: string,
  outDir: string
): Promise<void> => {
  const apiUrl = `https://huggingface.co/api/models/${modelId}`;
  console.log(`[downloadModelRepo] Querying model API: ${apiUrl}`);
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
  // Core configs/tokenizer
  const wanted = new Set<string>([
    'config.json',
    'tokenizer.json',
    'tokenizer_config.json',
    'preprocessor_config.json',
    'special_tokens_map.json',
    'vocab.json',
    'merges.txt',
  ]);

  // ONNX weights (any .onnx under onnx/)
  for (const s of siblings) {
    if (s.rfilename.startsWith('onnx/') && s.rfilename.endsWith('.onnx')) {
      wanted.add(s.rfilename);
    }
  }
  // If we didn't find any onnx files, try common names
  if (!Array.from(wanted).some((f) => f.endsWith('.onnx'))) {
    wanted.add('onnx/model.onnx');
  }

  const tasks: Promise<void>[] = [];
  for (const s of siblings) {
    if (!wanted.has(s.rfilename)) {
      continue;
    }
    const url = `https://huggingface.co/${modelId}/resolve/main/${s.rfilename}`;
    const dest = join(outDir, modelId, s.rfilename);
    mkdirp(dirname(dest));
    tasks.push(
      (async () => {
        console.log(
          `[downloadModelRepo] Downloading ${s.rfilename} from ${url}`
        );
        const r = await fetch(url);
        if (!r.ok) {
          throw new Error(`GET ${url} -> ${r.status}`);
        }
        const buf = new Uint8Array(await r.arrayBuffer());
        await writeFileAtomic(dest, buf);
        console.log(
          `[downloadModelRepo] Downloaded and saved ${s.rfilename} to ${dest}`
        );
      })()
    );
  }
  await Promise.all(tasks);
  console.log(
    `[downloadModelRepo] All required files for ${modelId} downloaded.`
  );
};

const main = async () => {
  console.log('🚀 Starting Dastyar AI build process...');

  // Create root dist directory
  if (existsSync(DIST_DIR)) {
    console.log(`[main] dist directory already exists at ${DIST_DIR}`);
  } else {
    console.log(`[main] Creating dist directory at ${DIST_DIR}`);
    mkdirSync(DIST_DIR, { recursive: true });
  }

  // Build server (outputs to apps/server/dist)
  console.log('📦 Building server...');
  console.log(`[main] Running 'bun run build' in ${SERVER_DIR}`);
  execSync('bun run build', {
    cwd: SERVER_DIR,
    stdio: 'inherit',
  });

  // Build web (outputs to apps/web/dist)
  console.log('🌐 Building web app...');
  console.log(`[main] Running 'bun run build' in ${WEB_DIR}`);
  execSync('bun run build', {
    cwd: WEB_DIR,
    stdio: 'inherit',
  });

  // Copy server binary and assets to root dist
  console.log('📋 Copying server to dist...');
  const serverDistDir = join(SERVER_DIR, 'dist');
  if (existsSync(serverDistDir)) {
    console.log(
      `[main] Copying server dist from ${serverDistDir} to ${DIST_DIR}`
    );
    cpSync(serverDistDir, DIST_DIR, { recursive: true, force: true });
  } else {
    console.log(
      `[main] Server dist directory does not exist: ${serverDistDir}`
    );
  }

  // Copy web build to dist/web
  console.log('📋 Copying web app to dist/web...');
  const webDistDir = join(WEB_DIR, 'dist');
  const webTargetDir = join(DIST_DIR, 'web');
  if (existsSync(webTargetDir)) {
    console.log(
      `[main] Web target directory already exists at ${webTargetDir}`
    );
  } else {
    console.log(`[main] Creating web target directory at ${webTargetDir}`);
    mkdirSync(webTargetDir, { recursive: true });
  }
  if (existsSync(webDistDir)) {
    console.log(
      `[main] Copying web dist from ${webDistDir} to ${webTargetDir}`
    );
    cpSync(webDistDir, webTargetDir, { recursive: true, force: true });
  } else {
    console.log(`[main] Web dist directory does not exist: ${webDistDir}`);
  }

  // Copy config file
  console.log('📋 Copying config file...');
  const configSrc = join(ROOT_DIR, 'config.prod.sample.json');
  const configDest = join(DIST_DIR, 'config.prod.json');
  if (existsSync(configSrc)) {
    console.log(`[main] Copying config from ${configSrc} to ${configDest}`);
    copyFileSync(configSrc, configDest);
  } else {
    console.log(`[main] Config source file does not exist: ${configSrc}`);
  }

  // Prepare offline dependencies (whisper models and cache)
  console.log('🤖 Preparing offline dependencies...');

  const wasmOut = join(DIST_DIR, 'wasm');
  const modelsOut = join(DIST_DIR, 'whisper-models');
  const cacheOut = join(DIST_DIR, '.whisper-cache');
  mkdirp(wasmOut);
  mkdirp(modelsOut);
  mkdirp(cacheOut);

  // Copy WASM assets (only if they don't exist)
  const wasmSrcDir = findTransformersWasmDir(ROOT_DIR);
  if (!wasmSrcDir) {
    throw new Error('Could not locate transformers wasm directory');
  }
  let wasmCopied = false;
  const wasmFiles = readdirSync(wasmSrcDir);
  console.log(`[main] Found WASM source directory: ${wasmSrcDir}`);
  for (const file of wasmFiles) {
    if (file.endsWith('.wasm')) {
      const destFile = join(wasmOut, file);
      if (existsSync(destFile)) {
        console.log(`[main] WASM file already exists at ${destFile}, skipping`);
      } else {
        console.log(`[main] Copying WASM file ${file} to ${destFile}`);
        copyFileIfExists(join(wasmSrcDir, file), destFile);
        wasmCopied = true;
      }
    }
  }
  if (wasmCopied) {
    console.log('Copied WASM assets to', wasmOut);
  } else {
    console.log('WASM assets already exist, skipping copy');
  }

  // Determine model ids from CLI args (supports comma-separated) or OFFLINE_MODEL env
  const cliArgs = process.argv
    .slice(2)
    .flatMap((arg) => arg.split(','))
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  const defaultWhisperModel = 'Xenova/whisper-tiny';
  const fallback = (process.env.OFFLINE_MODEL || defaultWhisperModel).trim();
  const modelIds = cliArgs.length > 0 ? cliArgs : [fallback];

  console.log(`[main] Model IDs to prepare: ${modelIds.join(', ')}`);

  await Promise.all(
    modelIds.map(async (modelId) => {
      const modelDir = join(modelsOut, modelId);
      if (existsSync(modelDir)) {
        console.log(`[main] Model already exists, skipping: ${modelId}`);
      } else {
        console.log(`[main] Downloading and preparing model: ${modelId}`);
        await downloadModelRepo(modelId, modelsOut);
        console.log(`[main] Prepared model at ${modelDir}`);
      }
    })
  );
  console.log('[main] All models prepared.');

  console.log('✅ Build complete! Files are in the "dist" directory:');
  console.log('   - dist/dastyar-ai (server binary)');
  console.log('   - dist/web/ (web app)');
  console.log('   - dist/whisper-models/ (offline models)');
  console.log('   - dist/.whisper-cache/ (model cache)');
  console.log('   - dist/wasm/ (WASM files)');
};

main().catch((err) => {
  console.error('[main] Build process failed:', err);
  process.exit(1);
});
