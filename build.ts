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

function ensureWhisperVenv() {
  const venvDir = join(WHISPER_DIR, ".venv");
  if (!existsSync(venvDir)) {
    console.log("📦 Creating Python venv for Whisper...");
    if (isWindows) {
      run("py -3 -m venv .venv", WHISPER_DIR);
    } else {
      run("python3 -m venv .venv", WHISPER_DIR);
    }
  }
  const py = isWindows
    ? join(venvDir, "Scripts", "python.exe")
    : join(venvDir, "bin", "python");
  console.log("📦 Installing Python deps (Whisper, FastAPI, PyInstaller)...");
  run(`${py} -m pip install --upgrade pip wheel setuptools`, WHISPER_DIR);
  const pkgs = [
    "fastapi==0.115.0",
    '"uvicorn[standard]"==0.30.0',
    "openai-whisper==20231117",
    "imageio-ffmpeg==0.4.9",
    "pyinstaller==6.4.0",
  ];
  run(`${py} -m pip install ${pkgs.join(" ")}`, WHISPER_DIR);
  return { venvDir, py } as const;
}

function ensureFfmpegInBin(): string | null {
  const binDir = join(WHISPER_DIR, "bin");
  ensureDir(binDir);
  const exe = isWindows ? "ffmpeg.exe" : "ffmpeg";
  const ffLocal = join(binDir, exe);
  if (existsSync(ffLocal)) return ffLocal;
  if (process.env.FF_SKIP_FFMPEG_DOWNLOAD === "1") return null;

  console.log("📥 Fetching static ffmpeg...");
  const os = process.platform;
  const arch = process.arch;
  if (os === "linux") {
    const url =
      arch === "arm64"
        ? "https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-arm64-static.tar.xz"
        : "https://johnvansickle.com/ffmpeg/releases/ffmpeg-release-amd64-static.tar.xz";
    const tmp = join(WHISPER_DIR, ".tmp.ffmpeg");
    run(`rm -rf "${tmp}" && mkdir -p "${tmp}"`);
    run(`curl -fsSL "${url}" -o "${tmp}/ffmpeg.tar.xz"`);
    run(`tar -xJf "${tmp}/ffmpeg.tar.xz" -C "${tmp}"`);
    run(
      `install -m 0755 "$(find "${tmp}" -type f -name ffmpeg -perm -u+x | head -n1)" "${ffLocal}"`
    );
    run(`rm -rf "${tmp}"`);
    return ffLocal;
  }
  if (os === "darwin") {
    const ver = "6.1.1";
    const url = `https://evermeet.cx/ffmpeg/ffmpeg-${ver}.zip`;
    const tmp = join(WHISPER_DIR, ".tmp.ffmpeg");
    run(`rm -rf "${tmp}" && mkdir -p "${tmp}"`);
    run(`curl -fsSL "${url}" -o "${tmp}/ffmpeg.zip"`);
    run(`unzip -q "${tmp}/ffmpeg.zip" -d "${tmp}"`);
    run(`install -m 0755 "${tmp}/ffmpeg" "${ffLocal}"`);
    run(`rm -rf "${tmp}"`);
    return ffLocal;
  }
  if (os === "win32") {
    const url =
      "https://www.gyan.dev/ffmpeg/builds/ffmpeg-6.1.1-essentials_build.zip";
    const pwsh = `powershell -NoProfile -Command "& { $ErrorActionPreference='Stop'; $u='${url}'; $d='${WHISPER_DIR}\\.tmp.ffmpeg'; New-Item -ItemType Directory -Force -Path $d | Out-Null; $z=Join-Path $d 'ffmpeg.zip'; Invoke-WebRequest -Uri $u -OutFile $z; Expand-Archive -Force -Path $z -DestinationPath $d; $bin=Get-ChildItem -Recurse -File -Path $d -Filter ffmpeg.exe | Select-Object -First 1; if (-not $bin) { Write-Error 'ffmpeg.exe not found in archive'; }; Copy-Item $bin.FullName '${ffLocal.replace(/\\/g, "/").replace(/\s/g, "` ")}' -Force }"`;
    run(pwsh);
    return ffLocal;
  }
  console.warn("Unsupported OS for ffmpeg bootstrap; skipping.");
  return null;
}

function buildWhisper() {
  console.log("[1/3] Building Whisper binary...");
  const { py } = ensureWhisperVenv();
  const ff = ensureFfmpegInBin();

  const exeName = isWindows ? "whisper.exe" : "whisper";
  const extra = ff ? ` --add-binary "${ff}${isWindows ? ";bin" : ":bin"}"` : "";
  const cmd = `${py} -m PyInstaller --name whisper --onefile --clean --noconfirm${extra} whisper/main.py`;
  run(cmd, WHISPER_DIR);

  const outDir = join(WHISPER_DIR, "dist");
  const src = join(outDir, exeName);
  const dest = join(DIST, exeName);
  if (!existsSync(src)) throw new Error(`Whisper binary not found at ${src}`);
  console.log("📋 Copying Whisper binary...");
  safeCopyFile(src, dest);
}

function buildWeb() {
  console.log("[2/3] Building web...");
  run("bun run build", WEB_DIR);
  console.log("📋 Copying web artifacts...");
  safeCopyDir(join(WEB_DIR, "dist"), join(DIST, "web"));
}

function buildServer(opts: { alsoWindowsOnMac?: boolean } = {}) {
  console.log("[3/3] Building server...");
  if (isWindows) {
    run("bun run build:windows", SERVER_DIR);
  } else {
    run("bun run build", SERVER_DIR);
    if (opts.alsoWindowsOnMac) {
      try {
        console.log("🪟 Building Windows server binary (cross-target)...");
        run("bun run build:windows", SERVER_DIR);
      } catch {
        console.warn("Windows cross-build failed or unsupported. Skipping.");
      }
    }
  }

  console.log("📋 Copying server artifacts...");
  safeCopyDir(join(SERVER_DIR, "dist"), DIST);
}

function main() {
  console.log("🚀 Build all: whisper → web → server");

  const wantsWindows = parseWantsWindows();

  if (process.env.NO_INSTALL !== "1") {
    console.log("📦 Installing dependencies (bun install)...");
    run("bun install", ROOT);
  } else {
    console.log("📦 Skipping dependency install (NO_INSTALL=1)");
  }

  ensureDir(DIST);

  buildWhisper();
  buildWeb();
  buildServer({
    alsoWindowsOnMac:
      !isWindows && (wantsWindows || process.env.BUILD_WINDOWS_SERVER === "1"),
  });

  // Convenience copies
  safeCopyFile(join(ROOT, ".env.example"), join(DIST, ".env.example"));
  safeCopyFile(join(ROOT, "config.json"), join(DIST, "config.json"));

  const whisperName = isWindows ? "whisper.exe" : "whisper";
  const serverHost = isWindows ? "dastyar-ai.exe" : "dastyar-ai";
  const outWhisper = join(DIST, whisperName);
  const outServerHost = join(DIST, serverHost);
  const outServerWin = join(DIST, "dastyar-ai.exe");
  console.log("\n✅ Done. Artifacts in ./dist:");
  if (existsSync(outWhisper)) console.log(` - ${whisperName}`);
  if (existsSync(outServerHost)) console.log(` - ${serverHost}`);
  if (
    !isWindows &&
    existsSync(outServerWin) &&
    serverHost !== "dastyar-ai.exe"
  ) {
    console.log(" - dastyar-ai.exe");
  }
  console.log(" - web/");
}

try {
  main();
} catch (err) {
  console.error("❌ Build failed:", err);
  process.exit(1);
}
