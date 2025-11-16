#!/usr/bin/env bun

import { execSync } from "node:child_process";
import { copyFileSync, cpSync, existsSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const DIST = join(ROOT, "dist");
const SERVER_DIR = join(ROOT, "apps", "server");
const WEB_DIR = join(ROOT, "apps", "web");
const WHISPER_DIR = join(ROOT, "apps", "whisper");

const isWindows = process.platform === "win32";

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

  if (!isWindows && !deps.bash) {
    console.warn("  ⚠️  bash not found - build script may not work correctly");
  }

  console.log("");
}

function buildWhisper() {
  console.log("[1/4] Building Whisper Go binary...");

  // Check if whisper.cpp is cloned
  const whisperCppDir = join(WHISPER_DIR, "whisper.cpp");
  if (!existsSync(whisperCppDir)) {
    console.log("📥 whisper.cpp not found, cloning...");
    run("git clone https://github.com/ggerganov/whisper.cpp.git", WHISPER_DIR);
  }

  // Check if models directory exists and has at least one model
  const modelsDir = join(WHISPER_DIR, "models");
  if (!existsSync(modelsDir)) {
    console.warn("⚠️  models/ directory not found, creating...");
    ensureDir(modelsDir);
  }

  let modelCount = 0;
  if (existsSync(modelsDir)) {
    try {
      const result = execSync(`find "${modelsDir}" -name "*.bin" -type f`, {
        encoding: "utf8",
        stdio: ["pipe", "pipe", "ignore"],
      });
      modelCount = result.trim().split("\n").filter(Boolean).length;
    } catch {
      modelCount = 0;
    }
  }

  if (modelCount === 0) {
    console.warn("⚠️  No Whisper models found in models/ directory");
    console.warn(
      "   You'll need to download at least one model before running:"
    );
    console.warn("   cd apps/whisper && ./download-model.sh ggml-base.bin");
  } else {
    console.log(`  ✓ Found ${modelCount} model(s)`);
  }

  console.log("📦 Building Whisper Go server with whisper.cpp...");

  if (isWindows) {
    console.error(
      "❌ Windows builds for Go Whisper are not yet supported in build.ts"
    );
    console.error(
      "   Please build manually on Windows using: cd apps/whisper && build.sh"
    );
    process.exit(1);
  }

  // Run the build script
  run("bash build.sh", WHISPER_DIR);

  const exeName = "whisper";
  const src = join(WHISPER_DIR, exeName);
  const dest = join(DIST, exeName);

  if (!existsSync(src)) {
    throw new Error(`Whisper binary not found at ${src}`);
  }

  console.log("📋 Copying Whisper binary to dist/...");
  safeCopyFile(src, dest);

  // Make executable on Unix
  if (!isWindows) {
    run(`chmod +x "${dest}"`);
  }

  console.log("✅ Whisper Go binary built successfully");
}

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
        console.warn(
          "⚠️  Windows cross-build failed or unsupported. Skipping."
        );
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
- \`web/\` - Static web assets (frontend)
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

All binaries are mostly self-contained:
- ✅ Whisper: Go binary with whisper.cpp (requires ffmpeg in PATH for audio conversion)
- ✅ Server: Includes Bun runtime + Node.js compatibility
- ✅ Web UI: Pre-built static assets

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

Whisper supports these GGML models (download manually):
- \`ggml-tiny.bin\` - Fastest, least accurate (~75MB)
- \`ggml-base.bin\` - Balanced (~142MB)
- \`ggml-small.bin\` - Good quality (~466MB)
- \`ggml-medium.bin\` - High quality (~1.5GB)
- \`ggml-large-v3.bin\` - Best quality (~2.9GB)

Download models before first use:
\`\`\`bash
# From the whisper directory or using download-model.sh
curl -L -o ggml-base.bin https://huggingface.co/ggerganov/whisper.cpp/resolve/main/ggml-base.bin
\`\`\`

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

function printBuildSummary() {
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
  console.log(
    "\n⚠️  Note: Whisper requires ffmpeg to be installed and available in PATH."
  );
  console.log(`${"=".repeat(60)}\n`);
}

function main() {
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

  buildWhisper();
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

try {
  main();
} catch (err) {
  console.error("❌ Build failed:", err);
  process.exit(1);
}
