import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const mkdirp = (dirPath: string) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const writeFileAtomic = async (dest: string, data: Uint8Array) => {
  const tmp = `${dest}.tmp-${Date.now()}`;
  await fs.promises.writeFile(tmp, data);
  await fs.promises.rename(tmp, dest);
};

const copyFileIfExists = (src: string, dest: string) => {
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, dest);
  }
};

const findTransformersWasmDir = (workspaceRoot: string): string | null => {
  // Bun vendors packages under node_modules/.bun/<name@version>/node_modules/<name>
  const bunNm = path.join(workspaceRoot, 'node_modules', '.bun');
  if (!fs.existsSync(bunNm)) {
    return null;
  }
  const entries = fs
    .readdirSync(bunNm)
    .filter((n) => n.startsWith('@huggingface+transformers@'))
    .sort()
    .reverse();
  for (const ent of entries) {
    const wasmDir = path.join(
      bunNm,
      ent,
      'node_modules',
      '@huggingface',
      'transformers',
      'dist'
    );
    if (fs.existsSync(wasmDir)) {
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
  if (![...wanted].some((f) => f.endsWith('.onnx'))) {
    wanted.add('onnx/model.onnx');
  }

  const tasks: Promise<void>[] = [];
  for (const s of siblings) {
    if (!wanted.has(s.rfilename)) {
      continue;
    }
    const url = `https://huggingface.co/${modelId}/resolve/main/${s.rfilename}`;
    const dest = path.join(outDir, modelId, s.rfilename);
    mkdirp(path.dirname(dest));
    tasks.push(
      (async () => {
        const r = await fetch(url);
        if (!r.ok) {
          throw new Error(`GET ${url} -> ${r.status}`);
        }
        const buf = new Uint8Array(await r.arrayBuffer());
        await writeFileAtomic(dest, buf);
        // eslint-disable-next-line no-console
        console.log('Downloaded', s.rfilename);
      })()
    );
  }
  await Promise.all(tasks);
};

const main = async () => {
  // Resolve workspace root and dist
  const scriptsDir = path.dirname(fileURLToPath(import.meta.url));
  const serverRoot = path.resolve(scriptsDir, '..', '..'); // apps/server
  const workspaceRoot = path.resolve(serverRoot, '..', '..');
  const distRoot = path.join(workspaceRoot, 'dist');

  const wasmOut = path.join(distRoot, 'wasm');
  const modelsOut = path.join(distRoot, 'whisper-models');
  const cacheOut = path.join(distRoot, '.whisper-cache');
  mkdirp(distRoot);
  mkdirp(wasmOut);
  mkdirp(modelsOut);
  mkdirp(cacheOut);

  // Copy WASM assets
  const wasmSrcDir = findTransformersWasmDir(workspaceRoot);
  if (!wasmSrcDir) {
    throw new Error('Could not locate transformers wasm directory');
  }
  for (const file of fs.readdirSync(wasmSrcDir)) {
    if (file.endsWith('.wasm')) {
      copyFileIfExists(path.join(wasmSrcDir, file), path.join(wasmOut, file));
    }
  }
  // eslint-disable-next-line no-console
  console.log('Copied WASM assets to', wasmOut);

  // Determine model ids from CLI args (supports comma-separated) or OFFLINE_MODEL env
  const cliArgs = process.argv
    .slice(2)
    .flatMap((arg) => arg.split(','))
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  const fallback = (process.env.OFFLINE_MODEL || 'Xenova/whisper-tiny').trim();
  const modelIds = cliArgs.length > 0 ? cliArgs : [fallback];

  await Promise.all(
    modelIds.map(async (modelId) => {
      await downloadModelRepo(modelId, modelsOut);
      // eslint-disable-next-line no-console
      console.log('Prepared model at', path.join(modelsOut, modelId));
    })
  );
};

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
