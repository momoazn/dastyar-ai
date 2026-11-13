import { describe, expect, it } from "bun:test";
import { CONFIG_SCHEMA } from "./config-schema";

describe("CONFIG_SCHEMA boolean keys", () => {
  it("reads the string 'false' as false", () => {
    const parsed = CONFIG_SCHEMA.parse({ OLLAMA_ENABLED: "false" });
    expect(parsed.OLLAMA_ENABLED).toBe(false);
  });

  it("reads the string 'true' as true", () => {
    const parsed = CONFIG_SCHEMA.parse({ SSL_ENABLED: "true" });
    expect(parsed.SSL_ENABLED).toBe(true);
  });

  it("keeps real booleans and numeric flags working", () => {
    expect(CONFIG_SCHEMA.parse({ OLLAMA_ENABLED: false }).OLLAMA_ENABLED).toBe(
      false
    );
    expect(CONFIG_SCHEMA.parse({ OLLAMA_ENABLED: 0 }).OLLAMA_ENABLED).toBe(
      false
    );
    expect(CONFIG_SCHEMA.parse({ OLLAMA_ENABLED: 1 }).OLLAMA_ENABLED).toBe(
      true
    );
  });

  it("rejects a flag that is neither boolean nor a boolean-like string", () => {
    expect(() => CONFIG_SCHEMA.parse({ OLLAMA_ENABLED: "maybe" })).toThrow();
  });
});
