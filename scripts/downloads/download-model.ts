#!/usr/bin/env bun

import { join } from "node:path";
import { WHISPER_APP_DIR } from "../project-paths";
import { ensureWhisperModel, WHISPER_MODEL_NAMES } from "../whisper-assets";

// Usage: bun run download:model [model-name] [--force]
const args = process.argv.slice(2);
const force = args.includes("--force");
const modelName = args.find((arg) => !arg.startsWith("--")) ?? "ggml-base.bin";

if (!(WHISPER_MODEL_NAMES as string[]).includes(modelName)) {
  console.error(
    `Unknown model "${modelName}". Choose one of: ${WHISPER_MODEL_NAMES.join(", ")}`
  );
  process.exit(1);
}

const path = await ensureWhisperModel({
  modelDir: join(WHISPER_APP_DIR, "models"),
  modelName,
  force,
});
console.log(`Model ready: ${path}`);
