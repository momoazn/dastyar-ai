#!/usr/bin/env bun

type LogTone = "error" | "info" | "muted" | "ok" | "step" | "warn";

const ANSI = {
  reset: "\u001b[0m",
  bold: "\u001b[1m",
  blue: "\u001b[34m",
  cyan: "\u001b[36m",
  gray: "\u001b[90m",
  green: "\u001b[32m",
  red: "\u001b[31m",
  yellow: "\u001b[33m",
} as const;

function colorsEnabled(): boolean {
  if (process.env.NO_COLOR) {
    return false;
  }
  if (process.env.FORCE_COLOR === "0") {
    return false;
  }
  if (process.env.FORCE_COLOR) {
    return true;
  }
  return Boolean(process.stdout?.isTTY);
}

const ENABLE_COLORS = colorsEnabled();

function paint(text: string, tone: LogTone): string {
  if (!ENABLE_COLORS) {
    return text;
  }

  let colorCode = ANSI.cyan;
  if (tone === "error") {
    colorCode = ANSI.red;
  } else if (tone === "ok") {
    colorCode = ANSI.green;
  } else if (tone === "warn") {
    colorCode = ANSI.yellow;
  } else if (tone === "step") {
    colorCode = ANSI.blue;
  } else if (tone === "muted") {
    colorCode = ANSI.gray;
  }

  return `${ANSI.bold}${colorCode}${text}${ANSI.reset}`;
}

export function buildTag(tone: LogTone): string {
  let label = "INFO";
  if (tone === "ok") {
    label = "OK";
  } else if (tone === "warn") {
    label = "WARN";
  } else if (tone === "error") {
    label = "ERROR";
  } else if (tone === "step") {
    label = "STEP";
  } else if (tone === "muted") {
    label = "NOTE";
  }

  return paint(`[${label}]`, tone);
}

export function withTag(tone: LogTone, message: string): string {
  return `${buildTag(tone)} ${message}`;
}

export function separator(tone: LogTone = "muted", width = 60): string {
  return paint("=".repeat(width), tone);
}
