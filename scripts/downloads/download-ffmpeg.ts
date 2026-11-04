#!/usr/bin/env bun

import { join } from "node:path";
import { WHISPER_APP_DIR } from "../project-paths";
import { downloadFfmpegBinaries } from "../whisper-assets";

// Usage: bun run download:ffmpeg [--all] [--force]
const args = process.argv.slice(2);

const binaries = await downloadFfmpegBinaries({
  binDir: join(WHISPER_APP_DIR, "ffmpeg-binaries"),
  all: args.includes("--all"),
  force: args.includes("--force"),
});
for (const binary of binaries) {
  console.log(`FFmpeg ready: ${binary}`);
}
