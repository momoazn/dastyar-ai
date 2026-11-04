import { describe, expect, it } from "bun:test";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { findSslConfigWarnings, replacePlaceholderJwtSecret } from "./config";
import { DEFAULT_CONFIG } from "./config-schema";

describe("replacePlaceholderJwtSecret", () => {
  it("writes a new random secret and keeps other keys", () => {
    const dir = mkdtempSync(join(tmpdir(), "dastyar-config-"));
    const path = join(dir, "config.json");
    writeFileSync(path, JSON.stringify({ ...DEFAULT_CONFIG }));

    try {
      const secret = replacePlaceholderJwtSecret(path);
      const saved = JSON.parse(readFileSync(path, "utf8"));

      expect(secret).not.toBe(DEFAULT_CONFIG.JWT_SECRET);
      expect(secret.length).toBeGreaterThanOrEqual(32);
      expect(saved.JWT_SECRET).toBe(secret);
      expect(saved.PORT).toBe(DEFAULT_CONFIG.PORT);
      expect(replacePlaceholderJwtSecret(path)).not.toBe(secret);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("findSslConfigWarnings", () => {
  it("returns nothing when SSL is off", () => {
    expect(
      findSslConfigWarnings({
        SSL_ENABLED: false,
        SSL_CERT_PATH: "",
        SSL_KEY_PATH: "",
      })
    ).toEqual([]);
  });

  it("warns for each missing certificate path", () => {
    expect(
      findSslConfigWarnings({
        SSL_ENABLED: true,
        SSL_CERT_PATH: "",
        SSL_KEY_PATH: "",
      })
    ).toHaveLength(2);
  });
});
