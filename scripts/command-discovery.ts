#!/usr/bin/env bun

const isWindows = process.platform === "win32";

export function hasCommand(cmd: string): boolean {
  if (Bun.which(cmd)) {
    return true;
  }

  if (isWindows && cmd === "cmake") {
    const probe = Bun.spawnSync(
      ["C:\\Program Files\\CMake\\bin\\cmake", "--version"],
      {
        stdout: "ignore",
        stderr: "ignore",
      }
    );
    if (probe.exitCode === 0) {
      return true;
    }
  }

  return false;
}
