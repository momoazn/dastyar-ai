#!/usr/bin/env bun

import { join } from "node:path";

export const REPO_ROOT = join(import.meta.dir, "..");
export const APPS_DIR = join(REPO_ROOT, "apps");
export const DIST_DIR = join(REPO_ROOT, "dist");
export const SERVER_APP_DIR = join(APPS_DIR, "server");
export const WEB_APP_DIR = join(APPS_DIR, "web");
export const WHISPER_APP_DIR = join(APPS_DIR, "whisper");
