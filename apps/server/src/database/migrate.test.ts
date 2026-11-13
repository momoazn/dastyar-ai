import { Database } from "bun:sqlite";
import { describe, expect, it } from "bun:test";
import { applyMigrations } from "./migrate";

const migrationData = (
  statements: string[],
  tag = "0000_test"
): Record<string, string> => ({
  "meta/_journal.json": JSON.stringify({
    entries: [{ idx: 0, tag, when: Date.now(), version: "6" }],
  }),
  [`${tag}.sql`]: statements.join("--> statement-breakpoint"),
});

const tableExists = (database: Database, name: string): boolean => {
  const row = database
    .prepare("SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?")
    .get(name);
  return row !== null;
};

describe("applyMigrations", () => {
  it("skips only the statement that already exists and applies the rest", () => {
    const database = new Database(":memory:");
    database.run("CREATE TABLE legacy (id integer)");

    applyMigrations(
      migrationData([
        "CREATE TABLE legacy (id integer)",
        "CREATE TABLE fresh (id integer)",
      ]),
      database
    );

    expect(tableExists(database, "fresh")).toBe(true);
    const applied = database
      .prepare("SELECT hash FROM __drizzle_migrations")
      .all();
    expect(applied).toHaveLength(1);
    database.close();
  });

  it("rolls back and records nothing when a statement fails", () => {
    const database = new Database(":memory:");

    expect(() =>
      applyMigrations(
        migrationData([
          "CREATE TABLE partial (id integer)",
          "CREATE INDEX idx_missing ON missing_table (id)",
        ]),
        database
      )
    ).toThrow();

    expect(tableExists(database, "partial")).toBe(false);
    const applied = database
      .prepare("SELECT hash FROM __drizzle_migrations")
      .all();
    expect(applied).toHaveLength(0);
    database.close();
  });
});
