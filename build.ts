#!/usr/bin/env bun

import { execSync } from "node:child_process";
import {
  copyFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
} from "node:fs";
import { join } from "node:path";
import JSZip from "jszip";

// =============================================================================
// Constants & Paths
// =============================================================================

const ROOT = process.cwd();
const DIST = join(ROOT, "dist");
const SERVER_DIR = join(ROOT, "apps", "server");
const WEB_DIR = join(ROOT, "apps", "web");
const WHISPER_DIR = join(ROOT, "apps", "whisper");

const isWindows = process.platform === "win32";

// =============================================================================
// Utility Functions
// =============================================================================

function parseWantsWindows(): boolean {
  const envPlatform = process.env.BUILD_PLATFORM?.toLowerCase();
  if (envPlatform === "windows") return true;
  const args = process.argv.slice(2);
  return args.some((a, i) =>
    a.startsWith("--platform=")
      ? a.split("=", 2)[1]?.toLowerCase() === "windows"
      : a === "--platform" && args[i + 1]?.toLowerCase() === "windows"
  );
}

const ensureDir = (dir: string) => {
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
};

const safeCopyDir = (srcDir: string, destDir: string) => {
  if (!existsSync(srcDir)) return;
  ensureDir(destDir);
  cpSync(srcDir, destDir, { recursive: true, force: true });
};

const safeCopyFile = (srcFile: string, destFile: string) => {
  if (!existsSync(srcFile)) return;
  ensureDir(join(destFile, ".."));
  copyFileSync(srcFile, destFile);
};

const run = (cmd: string, cwd?: string) => {
  execSync(cmd, { cwd, stdio: "inherit", env: process.env });
};

const hasCommand = (cmd: string): boolean => {
  try {
    execSync(isWindows ? `where ${cmd}` : `which ${cmd}`, {
      stdio: "ignore",
    });
    return true;
  } catch {
    return false;
  }
};

// =============================================================================
// Dependency & Environment Checks
// =============================================================================

function checkDependencies() {
  console.log("🔍 Checking build dependencies...");

  const deps = {
    bun: hasCommand("bun"),
    go: hasCommand("go"),
    bash: !isWindows && hasCommand("bash"),
  };

  if (!deps.bun) {
    console.error("❌ Bun is required but not found in PATH");
    console.error("   Install from: https://bun.sh");
    process.exit(1);
  }

  if (!deps.go) {
    console.error("❌ Go is required but not found in PATH");
    console.error("   Install from: https://go.dev/dl/ (1.23 or higher)");
    process.exit(1);
  }

  console.log("  ✓ Bun found");
  console.log("  ✓ Go found");

  if (!(isWindows || deps.bash)) {
    console.warn("  ⚠️  bash not found - build script may not work correctly");
  }

  console.log("");
}

// =============================================================================
// Whisper Build - Dependency Management (FFmpeg & Models)
// =============================================================================

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Download/extract logic inherently complex
async function downloadFFmpegIfNeeded(
  ffmpegBinDir: string,
  ffmpegFileName: string,
  ffmpegUrl: string
): Promise<string> {
  const ffmpegBinPath = join(ffmpegBinDir, ffmpegFileName);

  if (existsSync(ffmpegBinPath)) {
    console.log(
      `  ✓ FFmpeg binary found for ${process.platform}-${process.arch}`
    );
    return ffmpegBinPath;
  }

  console.log(
    `📥 FFmpeg not found for ${process.platform}-${process.arch}, downloading...`
  );
  console.warn("⚠️  This requires internet connection!");

  ensureDir(ffmpegBinDir);

  try {
    // Determine archive file extension and path
    let archiveExt = ".tar.gz";
    if (ffmpegUrl.endsWith(".zip")) {
      archiveExt = ".zip";
    } else if (ffmpegUrl.endsWith(".tar.xz")) {
      archiveExt = ".tar.xz";
    }
    const archivePath = join(
      ffmpegBinDir,
      `ffmpeg-${process.platform}-${process.arch}${archiveExt}`
    );

    // Check if archive already exists
    if (existsSync(archivePath)) {
      console.log("  ✓ Using cached FFmpeg archive");
    } else {
      console.log(`  → Downloading from ${ffmpegUrl}...`);

      // Download the FFmpeg archive
      const response = await fetch(ffmpegUrl);

      if (!response.ok) {
        throw new Error(
          `Failed to download FFmpeg: ${response.status} ${response.statusText}`
        );
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Failed to get response body reader");
      }

      const total = Number(response.headers.get("content-length")) || 0;
      let received = 0;

      // Create write stream
      const file = Bun.file(archivePath).writer();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        received += value.length;
        file.write(value);

        if (total > 0) {
          const percent = ((received / total) * 100).toFixed(1);
          process.stdout.write(`\r  → Downloaded ${percent}%`);
        }
      }

      console.log("");
    }

    // Extract the archive
    const isZip = ffmpegUrl.endsWith(".zip");
    const isTar =
      ffmpegUrl.endsWith(".tar.xz") || ffmpegUrl.endsWith(".tar.gz");

    if (isZip) {
      console.log("  → Extracting ZIP archive...");
      await extractZip(archivePath, ffmpegBinDir, ffmpegBinPath);
    } else if (isTar) {
      console.log("  → Extracting TAR archive...");
      await extractTar(archivePath, ffmpegBinDir);
    } else {
      // Assume it's a direct binary
      console.log("  → Copying binary...");
      const binaryData = await Bun.file(archivePath).arrayBuffer();
      await Bun.write(ffmpegBinPath, binaryData);
    }

    // Verify the FFmpeg binary exists
    if (!existsSync(ffmpegBinPath)) {
      throw new Error(`FFmpeg binary not found at ${ffmpegBinPath}`);
    }

    console.log(
      `  ✓ FFmpeg for ${process.platform}-${process.arch} ready (archive cached for future builds)`
    );
    return ffmpegBinPath;
  } catch (err) {
    console.error("  ❌ Failed to download FFmpeg");
    console.error("  You can manually download it to:", ffmpegBinPath);
    throw err;
  }
}

async function extractZip(
  zipPath: string,
  _extractDir: string,
  outputPath: string
): Promise<void> {
  // Use JavaScript library for cross-platform ZIP extraction
  try {
    const zipData = await Bun.file(zipPath).arrayBuffer();
    const zip = await new JSZip().loadAsync(zipData);

    // Find ffmpeg binary in the ZIP
    let ffmpegEntry: JSZip.JSZipObject | null = null;

    // Common locations for ffmpeg in Windows builds
    const possiblePaths = [
      "ffmpeg.exe",
      "bin/ffmpeg.exe",
      "ffmpeg-6.1.1-essentials_build/bin/ffmpeg.exe",
      "ffmpeg/bin/ffmpeg.exe",
    ];

    for (const path of possiblePaths) {
      if (zip.file(path)) {
        ffmpegEntry = zip.file(path);
        break;
      }
    }

    if (!ffmpegEntry) {
      // Fallback: find any file with "ffmpeg" in the name
      const allFiles = Object.keys(zip.files);
      const ffmpegFile = allFiles.find(
        (name) =>
          name.toLowerCase().includes("ffmpeg") &&
          !name.endsWith(".txt") &&
          !name.endsWith(".md") &&
          !name.endsWith("/")
      );

      if (ffmpegFile) {
        ffmpegEntry = zip.file(ffmpegFile);
      }
    }

    if (!ffmpegEntry) {
      throw new Error("Could not find ffmpeg.exe in ZIP archive");
    }

    // Extract the binary directly to final location
    const binaryData = await ffmpegEntry.async("arraybuffer");
    await Bun.write(outputPath, binaryData);

    console.log(`  ✓ FFmpeg extracted to ${outputPath}`);
  } catch (err) {
    console.error("ZIP extraction error:", err);
    throw new Error(`Failed to extract ZIP: ${err.message}`);
  }
}

function extractTar(tarPath: string, extractDir: string) {
  // For TAR files, we'll try to use the tar command
  try {
    if (hasCommand("tar")) {
      run(`tar -xf "${tarPath}" -C "${extractDir}"`, extractDir);
      return;
    }

    // If tar is not available, provide helpful error
    console.log("  ⚠️  TAR extraction requires 'tar' command");
    console.log("  💡 On macOS/Linux: tar is usually pre-installed");
    console.log("  💡 On Windows: Install Git Bash or WSL");
    throw new Error("No tar utility available");
  } catch (err) {
    console.error("TAR extraction error:", err);
    throw new Error(`Failed to extract TAR: ${err.message}`);
  }
}

async function findFiles(dir: string, patterns: string[]): Promise<string[]> {
  const results: string[] = [];

  async function walk(currentDir: string): Promise<void> {
    try {
      const { readdir } = await import("node:fs/promises");

      const items = await readdir(currentDir, { withFileTypes: true });

      for (const item of items) {
        const fullPath = join(currentDir, item.name);

        if (item.isDirectory()) {
          await walk(fullPath);
        } else {
          for (const pattern of patterns) {
            if (item.name.toLowerCase().includes(pattern.toLowerCase())) {
              results.push(fullPath);
            }
          }
        }
      }
    } catch {
      // Ignore errors
    }
  }

  await walk(dir);
  return results;
}

async function countExistingModels(modelsDir: string): Promise<number> {
  if (!existsSync(modelsDir)) return 0;

  try {
    const models = await findFiles(modelsDir, ["ggml", ".bin"]);
    return models.filter((file) => file.endsWith(".bin")).length;
  } catch {
    return 0;
  }
}

async function downloadBaseModelIfNeeded(modelsDir: string): Promise<number> {
  const modelCount = await countExistingModels(modelsDir);

  if (modelCount === 0) {
    console.log("📥 No Whisper models found, downloading ggml-base.bin...");
    console.warn("⚠️  This requires internet connection!");

    const baseModelUrl =
      "https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.bin";
    const baseModelPath = join(modelsDir, "ggml-base.bin");

    try {
      console.log("  → Downloading from HuggingFace (~142MB)...");

      const response = await fetch(baseModelUrl);
      if (!response.ok) {
        throw new Error(
          `Failed to download model: ${response.status} ${response.statusText}`
        );
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("Failed to get response body reader");
      }

      const total = Number(response.headers.get("content-length")) || 0;
      let received = 0;

      const file = Bun.file(baseModelPath).writer();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        received += value.length;
        file.write(value);

        if (total > 0) {
          const percent = ((received / total) * 100).toFixed(1);
          process.stdout.write(`\r  → Downloaded ${percent}%`);
        }
      }

      console.log("");
      console.log("  ✓ ggml-base.bin downloaded successfully");
      return 1;
    } catch (err) {
      console.error("  ❌ Failed to download base model");
      console.error(
        "  You can manually download it: cd apps/whisper && ./download-model.sh ggml-base.bin"
      );
      throw err;
    }
  }

  console.log(`  ✓ Found ${modelCount} model(s)`);
  return modelCount;
}

function determinePlatformFFmpeg(): { fileName: string; url: string } {
  const platform = process.platform;
  const arch = process.arch;

  if (platform === "win32") {
    return {
      fileName: "ffmpeg-windows-amd64.exe",
      url: "https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip",
    };
  }

  if (platform === "darwin") {
    return {
      fileName:
        arch === "arm64" ? "ffmpeg-darwin-arm64" : "ffmpeg-darwin-amd64",
      url: "https://evermeet.cx/ffmpeg/ffmpeg-6.1.1.zip",
    };
  }

  // Linux
  return {
    fileName: arch === "arm64" ? "ffmpeg-linux-arm64" : "ffmpeg-linux-amd64",
    url:
      arch === "arm64"
        ? "https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-arm64-static.tar.xz"
        : "https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz",
  };
}

// =============================================================================
// Whisper Build - Asset Copying
// =============================================================================

function copyWhisperBinary() {
  const srcName = isWindows ? "whisper.exe" : "whisper";
  const destName = isWindows ? "whisper.exe" : "whisper";
  const src = join(WHISPER_DIR, srcName);
  const dest = join(DIST, destName);

  if (!existsSync(src)) {
    throw new Error(`Whisper binary not found at ${src}`);
  }

  console.log("📋 Copying Whisper binary to dist/...");
  safeCopyFile(src, dest);

  if (!isWindows) {
    run(`chmod +x "${dest}"`);
  }
}

async function copyWhisperModels() {
  console.log("📋 Copying Whisper models to dist/models/...");
  const modelsSrc = join(WHISPER_DIR, "models");
  const modelsDest = join(DIST, "models");

  if (!existsSync(modelsSrc)) {
    console.warn("  ⚠️  No models directory found - skipping model copy");
    console.warn(
      "     Download models with: cd apps/whisper && ./download-model.sh ggml-base.bin"
    );
    return;
  }

  safeCopyDir(modelsSrc, modelsDest);

  try {
    const modelFiles = await findFiles(modelsDest, [".bin"]);
    const copiedCount = modelFiles.filter((file) =>
      file.endsWith(".bin")
    ).length;

    if (copiedCount > 0) {
      console.log(`  ✓ Copied ${copiedCount} Whisper model(s) to dist/models/`);
    } else {
      console.warn("  ⚠️  No models copied - you'll need to add them manually");
    }
  } catch {
    console.warn("  ⚠️  Could not verify model copy");
  }
}

function copyFFmpegBinary(ffmpegBinPath: string) {
  console.log("📋 Copying FFmpeg binary to dist/...");
  const platform = process.platform;
  const arch = process.arch;
  const ffmpegDestName = isWindows ? "ffmpeg.exe" : "ffmpeg";
  const ffmpegDestPath = join(DIST, ffmpegDestName);

  if (!existsSync(ffmpegBinPath)) {
    console.warn(`  ⚠️  FFmpeg binary not found at ${ffmpegBinPath}`);
    return;
  }

  safeCopyFile(ffmpegBinPath, ffmpegDestPath);

  if (!isWindows) {
    try {
      run(`chmod +x "${ffmpegDestPath}"`);
    } catch {
      // Ignore chmod errors
    }
  }

  console.log(
    `  ✓ Copied FFmpeg for ${platform}-${arch} to dist/${ffmpegDestName}`
  );
}

// =============================================================================
// Whisper Build - Orchestration
// =============================================================================

async function buildWhisper() {
  console.log("[1/4] Building Whisper Go binary...");

  // Check if whisper.cpp is cloned
  const whisperCppDir = join(WHISPER_DIR, "whisper.cpp");
  if (!existsSync(whisperCppDir)) {
    console.log("📥 whisper.cpp not found, cloning...");
    console.warn("⚠️  This requires internet connection!");
    run("git clone https://github.com/ggerganov/whisper.cpp.git", WHISPER_DIR);
  }

  // Auto-download FFmpeg binary for current platform
  const ffmpegBinDir = join(WHISPER_DIR, "ffmpeg-binaries");
  ensureDir(ffmpegBinDir);
  const { fileName: ffmpegFileName, url: ffmpegUrl } =
    determinePlatformFFmpeg();
  const ffmpegBinPath = await downloadFFmpegIfNeeded(
    ffmpegBinDir,
    ffmpegFileName,
    ffmpegUrl
  );

  // Auto-download base model if no models exist
  const modelsDir = join(WHISPER_DIR, "models");
  ensureDir(modelsDir);
  await downloadBaseModelIfNeeded(modelsDir);

  console.log("📦 Building Whisper Go server with whisper.cpp...");

  // Build whisper.cpp with cmake
  const whisperCppBuildDir = join(whisperCppDir, "build_go");
  console.log("  → Building whisper.cpp library with cmake...");

  // Configure cmake
  run(
    "cmake -S . -B build_go -DCMAKE_BUILD_TYPE=Release -DBUILD_SHARED_LIBS=OFF -DWHISPER_BUILD_TESTS=OFF -DWHISPER_BUILD_EXAMPLES=OFF",
    whisperCppDir
  );

  // Build with cmake
  run(
    "cmake --build build_go --target whisper --config Release",
    whisperCppDir
  );
  console.log("  ✓ whisper.cpp library built");

  // Build Go application
  console.log("  → Building Go whisper server...");
  const whisperRoot = whisperCppDir;
  const buildDir = whisperCppBuildDir;
  const ggmlSrc = join(buildDir, "ggml", "src");

  // Set up Go build environment
  const goWorkDir = join(WHISPER_DIR, ".go-work");
  const goCacheDir = join(goWorkDir, "build-cache");
  const goModCacheDir = join(goWorkDir, "pkg", "mod");

  ensureDir(goCacheDir);
  ensureDir(goModCacheDir);

  const buildEnv = {
    ...process.env,
    GOPATH: goWorkDir,
    GOCACHE: goCacheDir,
    GOMODCACHE: goModCacheDir,
    C_INCLUDE_PATH: `${join(whisperRoot, "include")}${isWindows ? ";" : ":"}${join(whisperRoot, "ggml", "include")}`,
    LIBRARY_PATH: `${join(buildDir, "src")}${isWindows ? ";" : ":"}${ggmlSrc}`,
    CGO_LDFLAGS: `-L${join(buildDir, "src")} -L${ggmlSrc}`,
  };

  // Build the Go binary
  const outputName = isWindows ? "whisper.exe" : "whisper";
  execSync(`go build -o ${outputName} .`, {
    cwd: WHISPER_DIR,
    stdio: "inherit",
    env: buildEnv,
  });

  console.log("  ✓ Go whisper server built");

  copyWhisperBinary();
  await copyWhisperModels();
  copyFFmpegBinary(ffmpegBinPath);

  console.log("✅ Whisper Go binary built successfully");
}

// =============================================================================
// Web Frontend Build
// =============================================================================

function buildWeb() {
  console.log("[2/4] Building web frontend to static assets...");
  console.log("📦 Running Vite build...");
  run("bun run build", WEB_DIR);

  const webSrc = join(WEB_DIR, "dist");
  const webDest = join(DIST, "web");

  if (!existsSync(webSrc)) {
    throw new Error(`Web build artifacts not found at ${webSrc}`);
  }

  console.log("📋 Copying web artifacts to dist/web/...");
  safeCopyDir(webSrc, webDest);
  console.log("✅ Web frontend built successfully");
}

// =============================================================================
// Server Build
// =============================================================================

function buildServer(opts: { alsoWindowsOnMac?: boolean } = {}) {
  console.log("[3/4] Building server binary with embedded Bun runtime...");
  console.log(
    "📦 The server will serve static web assets from ./web relative to the binary"
  );

  if (isWindows) {
    console.log("🪟 Compiling for Windows (bun-windows-x64)...");
    run("bun run build:windows", SERVER_DIR);
  } else {
    console.log("📦 Compiling for current platform...");
    run("bun run build", SERVER_DIR);
    if (opts.alsoWindowsOnMac) {
      try {
        console.log("🪟 Cross-compiling Windows server binary...");
        run("bun run build:windows", SERVER_DIR);
      } catch {
        console.warn("⚠️  Windows cross-build failed or unsupported. Skipping.");
      }
    }
  }

  const serverDist = join(SERVER_DIR, "dist");
  if (!existsSync(serverDist)) {
    throw new Error(`Server build artifacts not found at ${serverDist}`);
  }

  console.log("📋 Copying server binaries to dist/...");
  safeCopyDir(serverDist, DIST);
  console.log("✅ Server binary built successfully");
}

// =============================================================================
// Distribution Package Setup
// =============================================================================

function createDistReadme(destPath: string) {
  const whisperBin = isWindows ? "whisper.exe" : "./whisper";
  const serverBin = isWindows ? "dastyar-ai.exe" : "./dastyar-ai";

  const readme = `# Dastyar AI - Distribution

This folder contains standalone executable binaries for Dastyar AI.

## Contents

- \`${
    isWindows ? "whisper.exe" : "whisper"
  }\` - Whisper API server (Go-based, transcription service)
- \`${
    isWindows ? "dastyar-ai.exe" : "dastyar-ai"
  }\` - Main API server with embedded web UI
- \`${
    isWindows ? "ffmpeg.exe" : "ffmpeg"
  }\` - FFmpeg binary for audio conversion (auto-detected by Whisper)
- \`web/\` - Static web assets (frontend)
- \`models/\` - Whisper AI models (*.bin files)
- \`config.json\` - Configuration file
- \`.env.example\` - Environment variables example

## Quick Start

### 1. Configure (Optional)

Edit \`config.json\` to customize settings. All settings have sensible defaults.

Important settings:
- \`PORT\`: Server port (default: 3000)
- \`HOST\`: Server host (default: 127.0.0.1)
- \`WHISPER_SERVER_URL\`: Whisper API URL (default: http://127.0.0.1:8080)
- \`JWT_SECRET\`: **IMPORTANT**: Change this for production!
- \`OLLAMA_BASE_URL\`: Ollama API URL (default: http://localhost:11434)

### 2. Start the Services

**On macOS/Linux:**

\`\`\`bash
# Terminal 1 - Start Whisper API (for transcription)
${whisperBin}

# Terminal 2 - Start main server
${serverBin}
\`\`\`

**On Windows:**

\`\`\`cmd
REM Terminal 1 - Start Whisper API
whisper.exe

REM Terminal 2 - Start main server
dastyar-ai.exe
\`\`\`

### 3. Access the Application

Open your browser and navigate to: **http://localhost:3000**

## Requirements

### Minimal Runtime Dependencies

All binaries are completely self-contained - no installation required:
- ✅ Whisper: Go binary with whisper.cpp (includes bundled FFmpeg)
- ✅ Server: Includes Bun runtime + Node.js compatibility
- ✅ Web UI: Pre-built static assets
- ✅ FFmpeg: Bundled alongside Whisper (auto-detected at runtime)
- ✅ AI Models: Whisper model included (ggml-base.bin, ~142MB)

**Zero external dependencies** - just extract and run!

### External Services (Optional)

For full functionality, you may want to install:
- **Ollama** (for local LLM models): https://ollama.ai
- **LM Studio** (alternative local LLM): https://lmstudio.ai
- **Stable Diffusion WebUI** (for image generation): https://github.com/AUTOMATIC1111/stable-diffusion-webui

These are optional - you can configure which services to use in \`config.json\`.

## Configuration Details

### Database

The server creates a SQLite database at \`./data.db\` on first run.

### Storage Directories

The following directories are created automatically:
- \`./generated-images\` - AI-generated images
- \`./uploaded-documents\` - Uploaded documents for RAG

### Whisper Models

The \`models/\` directory contains Whisper AI models (*.bin files).
If no models are included, download them from HuggingFace:

Available models:
- \`ggml-tiny.bin\` - Fastest, least accurate (~75MB)
- \`ggml-base.bin\` - Balanced (~142MB) - Recommended
- \`ggml-small.bin\` - Good quality (~466MB)
- \`ggml-medium.bin\` - High quality (~1.5GB)
- \`ggml-large-v3.bin\` - Best quality (~2.9GB)

To add more models:
\`\`\`bash
# Download directly into the models/ directory
cd models
curl -L -o ggml-base.bin https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.bin
\`\`\`

The Whisper binary automatically detects all .bin files in the models/ directory.

## Ports

Default ports (configurable in \`config.json\`):
- **3000** - Main server + Web UI
- **8080** - Whisper API

## Troubleshooting

### "Permission denied" on macOS/Linux

\`\`\`bash
chmod +x whisper dastyar-ai
\`\`\`

### Cannot connect to Whisper

Make sure the Whisper binary is running before starting the main server.
Check the URL in \`config.json\` matches where Whisper is running.

### Cannot connect to Ollama/LM Studio

1. Ensure Ollama/LM Studio is installed and running
2. Check the URL in \`config.json\`
3. Or disable in \`config.json\`: \`"OLLAMA_ENABLED": false\`

### Database errors

Delete \`data.db\` to reset the database (⚠️ this deletes all data).

## Production Deployment

### Security Checklist

Before deploying to production:

1. ✅ Change \`JWT_SECRET\` to a strong random value (min 32 chars)
2. ✅ Update \`CORS_ORIGIN\` to your domain
3. ✅ Use a reverse proxy (nginx, Caddy) for HTTPS
4. ✅ Run as a non-root user
5. ✅ Set appropriate file permissions
6. ✅ Configure firewall rules
7. ✅ Regular backups of \`data.db\`

### Running as a Service

**systemd (Linux):**

Create \`/etc/systemd/system/dastyar-whisper.service\`:

\`\`\`ini
[Unit]
Description=Dastyar AI Whisper Service
After=network.target

[Service]
Type=simple
User=dastyar
WorkingDirectory=/opt/dastyar-ai
ExecStart=/opt/dastyar-ai/whisper
Restart=always

[Install]
WantedBy=multi-user.target
\`\`\`

Create \`/etc/systemd/system/dastyar-server.service\`:

\`\`\`ini
[Unit]
Description=Dastyar AI Server
After=network.target dastyar-whisper.service

[Service]
Type=simple
User=dastyar
WorkingDirectory=/opt/dastyar-ai
ExecStart=/opt/dastyar-ai/dastyar-ai
Restart=always

[Install]
WantedBy=multi-user.target
\`\`\`

Then:

\`\`\`bash
sudo systemctl enable dastyar-whisper dastyar-server
sudo systemctl start dastyar-whisper dastyar-server
\`\`\`

## Support

For issues, questions, or contributions, visit the project repository.

## License

See the main project repository for license information.
`;

  Bun.write(destPath, readme);
  console.log("  ✓ README.md created");
}

function createDefaultConfig(destPath: string) {
  const defaultConfig = {
    PORT: 3000,
    HOST: "127.0.0.1",
    CORS_ORIGIN: "http://localhost:3000,http://localhost:5173",
    JWT_SECRET:
      "your-super-secret-jwt-key-change-this-in-production-min-32-chars",
    JWT_EXPIRES_IN: 86_400,
    DATABASE_FILE: "./data.db",
    WHISPER_SERVER_URL: "http://127.0.0.1:8080",
    WHISPER_TIMEOUT_MS: 120_000,
    WHISPER_MODELS: "tiny",
    OLLAMA_BASE_URL: "http://localhost:11434",
    OLLAMA_ENABLED: true,
    LMSTUDIO_BASE_URL: "http://localhost:1234/v1",
    LMSTUDIO_ENABLED: true,
    GROQ_API_KEY: "",
    GROQ_ENABLED: false,
    GEMINI_API_KEY: "",
    GEMINI_ENABLED: false,
    STABLE_DIFFUSION_URL: "http://localhost:7860",
    STABLE_DIFFUSION_ENABLED: true,
    IMAGES_DIR: "./generated-images",
    DOCUMENTS_DIR: "./uploaded-documents",
    EMBEDDING_MODEL: "nomic-embed-text",
    WEB_DIST_DIR: "./web",
  } as const;

  const content = JSON.stringify(defaultConfig, null, 2);
  Bun.write(destPath, content);
  console.log(`  ✓ Default config.json created at ${destPath}`);
}

// =============================================================================
// Distribution Validation & Reporting
// =============================================================================

function validateDistStructure() {
  console.log("[4/4] Validating build artifacts...");

  const whisperName = isWindows ? "whisper.exe" : "whisper";
  const serverName = isWindows ? "dastyar-ai.exe" : "dastyar-ai";

  const requiredFiles = [
    { path: join(DIST, whisperName), desc: "Whisper binary" },
    { path: join(DIST, serverName), desc: "Server binary" },
    { path: join(DIST, "web"), desc: "Web assets directory" },
    { path: join(DIST, "web", "index.html"), desc: "Web index.html" },
  ];

  const optionalFiles = [
    { path: join(DIST, "config.json"), desc: "Configuration file" },
    { path: join(DIST, ".env.example"), desc: "Environment example file" },
    { path: join(DIST, "models"), desc: "Whisper models directory" },
  ];

  // FFmpeg files - at least one should exist
  const ffmpegFiles = [
    { path: join(DIST, "ffmpeg.exe"), desc: "FFmpeg (Windows)" },
    { path: join(DIST, "ffmpeg"), desc: "FFmpeg (Unix)" },
  ];

  let hasErrors = false;

  for (const { path, desc } of requiredFiles) {
    if (existsSync(path)) {
      console.log(`✓ ${desc}`);
    } else {
      console.error(`❌ Missing required file: ${desc} at ${path}`);
      hasErrors = true;
    }
  }

  for (const { path, desc } of optionalFiles) {
    if (existsSync(path)) {
      console.log(`✓ ${desc}`);
    }
  }

  // Check FFmpeg - at least one should exist
  const hasFfmpeg = ffmpegFiles.some(({ path }) => existsSync(path));
  if (hasFfmpeg) {
    for (const { path, desc } of ffmpegFiles) {
      if (existsSync(path)) {
        console.log(`✓ ${desc}`);
      }
    }
  } else {
    console.warn("⚠️  No FFmpeg binary found - audio conversion may not work");
  }

  // Check for Windows cross-compile binary
  if (!isWindows) {
    const winBinary = join(DIST, "dastyar-ai.exe");
    if (existsSync(winBinary)) {
      console.log("✓ Windows server binary (cross-compiled)");
    }
  }

  if (hasErrors) {
    throw new Error(
      "Build validation failed. Some required artifacts are missing."
    );
  }

  console.log("✅ All build artifacts validated successfully");
}

async function printBuildSummary() {
  const whisperName = isWindows ? "whisper.exe" : "whisper";
  const serverHost = isWindows ? "dastyar-ai.exe" : "dastyar-ai";
  const outWhisper = join(DIST, whisperName);
  const outServerHost = join(DIST, serverHost);
  const outServerWin = join(DIST, "dastyar-ai.exe");

  console.log(`\n${"=".repeat(60)}`);
  console.log("🎉 BUILD COMPLETED SUCCESSFULLY");
  console.log("=".repeat(60));
  console.log("\nBuild artifacts in ./dist:");
  console.log("\n📦 Binaries:");
  if (existsSync(outWhisper)) {
    console.log(
      `   - ${whisperName} (Whisper API server - Go binary with whisper.cpp)`
    );
  }
  if (existsSync(outServerHost)) {
    console.log(
      `   - ${serverHost} (Main API server with embedded Bun runtime)`
    );
  }
  if (
    !isWindows &&
    existsSync(outServerWin) &&
    serverHost !== "dastyar-ai.exe"
  ) {
    console.log("   - dastyar-ai.exe (Windows server binary, cross-compiled)");
  }

  console.log("\n📁 Assets:");
  console.log("   - web/ (Static frontend assets served by the server binary)");

  const modelsPath = join(DIST, "models");
  if (existsSync(modelsPath)) {
    try {
      const modelFiles = await findFiles(modelsPath, [".bin"]);
      const modelsCount = modelFiles.filter((file) =>
        file.endsWith(".bin")
      ).length;
      if (modelsCount > 0) {
        console.log(`   - models/ (${modelsCount} Whisper model(s))`);
      }
    } catch {
      // Ignore count error
    }
  }

  const distFfmpegWindows = join(DIST, "ffmpeg.exe");
  const distFfmpegUnix = join(DIST, "ffmpeg");
  if (existsSync(distFfmpegWindows)) {
    console.log("   - ffmpeg.exe (Audio conversion for Windows)");
  }
  if (existsSync(distFfmpegUnix)) {
    console.log("   - ffmpeg (Audio conversion for Unix)");
  }

  const configPath = join(DIST, "config.json");
  const envPath = join(DIST, ".env.example");
  if (existsSync(configPath) || existsSync(envPath)) {
    console.log("\n⚙️  Configuration:");
    if (existsSync(configPath)) console.log("   - config.json");
    if (existsSync(envPath)) console.log("   - .env.example");
  }

  console.log("\n📝 Usage:");
  console.log(
    "   1. Start Whisper API: ./dist/whisper (runs on port 8080 by default)"
  );
  console.log(
    "   2. Start main server: ./dist/dastyar-ai (runs on port 3000 by default)"
  );
  console.log("   3. Access web UI: http://localhost:3000");
  console.log(
    "\n💡 Note: The server binary serves the web/ directory automatically."
  );
  console.log(
    "   Keep the web/ folder next to the binary for the frontend to work."
  );
  console.log("\n⚠️  Important Notes:");
  console.log(
    "   - FFmpeg is bundled in dist/ for audio conversion (no installation needed)"
  );
  console.log("   - Whisper models are in dist/models/ for offline deployment");
  console.log("   - Change JWT_SECRET in config.json before production use");
  console.log(`${"=".repeat(60)}\n`);

  // Print offline deployment checklist
  await printOfflineDeploymentChecklist();
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: Go Away
async function printOfflineDeploymentChecklist() {
  console.log(`\n${"=".repeat(60)}`);
  console.log("📋 OFFLINE WINDOWS DEPLOYMENT CHECKLIST");
  console.log("=".repeat(60));

  const modelsPath = join(DIST, "models");
  const whisperExe = join(DIST, "whisper.exe");
  const serverExe = join(DIST, "dastyar-ai.exe");

  console.log("\n✅ Required for offline deployment:\n");

  // Check Whisper models
  let modelsOk = false;
  if (existsSync(modelsPath)) {
    try {
      const modelFiles = await findFiles(modelsPath, [".bin"]);
      const count = modelFiles.filter((file) => file.endsWith(".bin")).length;
      if (count > 0) {
        console.log(`   ✅ Whisper models: ${count} model(s) in dist/models/`);
        modelsOk = true;
      } else {
        console.log("   ❌ Whisper models: None found");
      }
    } catch {
      console.log("   ⚠️  Whisper models: Could not verify");
    }
  } else {
    console.log("   ❌ Whisper models: Directory not found");
  }

  // Check FFmpeg binaries in dist/
  const distFfmpegWindows = join(DIST, "ffmpeg.exe");
  const distFfmpegUnix = join(DIST, "ffmpeg");
  const ffmpegOk = existsSync(distFfmpegWindows) || existsSync(distFfmpegUnix);

  if (ffmpegOk) {
    if (existsSync(distFfmpegWindows)) {
      console.log("   ✅ FFmpeg for Windows: Bundled in dist/ffmpeg.exe");
    }
    if (existsSync(distFfmpegUnix)) {
      console.log("   ✅ FFmpeg for Unix: Bundled in dist/ffmpeg");
    }
  } else {
    console.log("   ❌ FFmpeg: Not bundled in dist/");
    console.log(
      "      The build will auto-download if missing from apps/whisper/internal/ffmpeg/bin/"
    );
  }

  // Check Windows binaries
  const whisperWinOk = existsSync(whisperExe);
  const serverWinOk = existsSync(serverExe);

  if (whisperWinOk) {
    console.log("   ✅ Whisper.exe: Built for Windows");
  } else {
    console.log(
      "   ❌ Whisper.exe: Missing (build on Windows or cross-compile)"
    );
  }

  if (serverWinOk) {
    console.log("   ✅ Server.exe: Built for Windows");
  } else {
    console.log("   ❌ Server.exe: Missing");
  }

  // Check security
  const configPath = join(DIST, "config.json");
  let jwtSecure = false;
  if (existsSync(configPath)) {
    try {
      const configContent = readFileSync(configPath, "utf8");
      const config = JSON.parse(configContent) as { JWT_SECRET?: string };
      const defaultSecret =
        "your-super-secret-jwt-key-change-this-in-production";
      jwtSecure =
        config.JWT_SECRET !== defaultSecret &&
        (config.JWT_SECRET?.length ?? 0) >= 32;

      if (jwtSecure) {
        console.log("   ✅ JWT_SECRET: Custom secure value set");
      } else {
        console.log(
          "   ⚠️  JWT_SECRET: Using default or too short - CHANGE THIS!"
        );
      }
    } catch {
      console.log("   ⚠️  JWT_SECRET: Could not verify");
    }
  }

  console.log("\n📝 Next steps:\n");

  if (!modelsOk) {
    console.log("   1. Download Whisper models:");
    console.log("      cd apps/whisper && ./download-model.sh ggml-base.bin");
    console.log("      Then rebuild: bun run build");
  }

  if (!ffmpegOk) {
    console.log("   2. FFmpeg missing (should auto-download on next build):");
    console.log(
      "      Or manually: cd apps/whisper && ./download-ffmpeg.sh --all"
    );
    console.log("      Then rebuild: bun run build");
  }

  if (!(whisperWinOk || isWindows)) {
    console.log("   3. Build Whisper for Windows:");
    console.log("      (Requires building on Windows with Go, CMake, MinGW)");
    console.log("      Or use cross-compilation if supported");
  }

  if (!jwtSecure) {
    console.log("   4. Update JWT_SECRET in dist/config.json:");
    console.log("      Generate: openssl rand -base64 48");
    console.log("      Or use any secure random string (min 32 chars)");
  }

  console.log("\n💡 For complete offline deployment:");
  console.log("   - Copy entire dist/ folder to Windows machine");
  console.log("   - No internet connection needed after deployment");
  console.log("   - All AI processing runs locally");

  console.log(`${"=".repeat(60)}\n`);
}

// =============================================================================
// Main Build Orchestration
// =============================================================================

async function main() {
  console.log(`\n${"=".repeat(60)}`);
  console.log("🚀 BUILDING DASTYAR AI - STANDALONE BINARIES");
  console.log("=".repeat(60));
  console.log("\nThis will create:");
  console.log("  • Whisper API binary (Go + whisper.cpp)");
  console.log("  • Web frontend (static assets)");
  console.log("  • Server binary (Bun runtime + API, serves web assets)");
  console.log(`${"=".repeat(60)}\n`);

  // Check required dependencies first
  checkDependencies();

  const wantsWindows = parseWantsWindows();

  if (process.env.NO_INSTALL !== "1") {
    console.log("📦 Installing JavaScript/TypeScript dependencies...");
    console.log("  → Running bun install at workspace root");
    run("bun install", ROOT);
    console.log("✅ JavaScript dependencies installed\n");
  } else {
    console.log("📦 Skipping dependency install (NO_INSTALL=1)\n");
  }

  ensureDir(DIST);

  await buildWhisper();
  console.log("");

  buildWeb();
  console.log("");

  buildServer({
    alsoWindowsOnMac:
      !isWindows && (wantsWindows || process.env.BUILD_WINDOWS_SERVER === "1"),
  });
  console.log("");

  // Copy configuration files
  console.log("📋 Copying configuration files...");
  const envExample = join(ROOT, ".env.example");
  const configFile = join(ROOT, "config.json");

  if (existsSync(envExample)) {
    safeCopyFile(envExample, join(DIST, ".env.example"));
    console.log("  ✓ .env.example copied");
  } else {
    console.warn("  ⚠️  .env.example not found in root, skipping");
  }

  if (existsSync(configFile)) {
    safeCopyFile(configFile, join(DIST, "config.json"));
    console.log("  ✓ config.json copied");
  } else {
    console.warn(
      "  ⚠️  config.json not found in root, creating default config..."
    );
    createDefaultConfig(join(DIST, "config.json"));
  }
  console.log("✅ Configuration files ready\n");

  // Create README for distribution
  console.log("📋 Creating README for distribution...");
  createDistReadme(join(DIST, "README.md"));
  console.log("✅ README created\n");

  validateDistStructure();

  printBuildSummary();
}

// =============================================================================
// Entry Point
// =============================================================================

try {
  await main();
} catch (err) {
  console.error("❌ Build failed:", err);
  process.exit(1);
}
