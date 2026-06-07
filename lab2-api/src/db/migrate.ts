import fs from "node:fs";
import path from "node:path";
import { DbClient } from "./dbClient.js";
import { DB_PATH, MIGRATIONS_DIR } from "./db.js";

type MigrationRow = {
  filename: string;
};

export async function migrate(dbPath: string = DB_PATH): Promise<void> {
  const db = new DbClient(dbPath);

  try {
    await db.run("PRAGMA foreign_keys = ON;");

    await db.run(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id INTEGER PRIMARY KEY,
        filename TEXT NOT NULL UNIQUE,
        appliedAt TEXT NOT NULL
      );
    `);

    const files = fs
      .readdirSync(MIGRATIONS_DIR)
      .filter((file) => /^\d+_.+\.sql$/.test(file))
      .sort();

    const applied = await db.all<MigrationRow>(
      "SELECT filename FROM schema_migrations;",
    );
    const appliedSet = new Set(applied.map((row) => row.filename));

    for (const file of files) {
      if (appliedSet.has(file)) {
        continue;
      }

      const fullPath = path.join(MIGRATIONS_DIR, file);
      const sql = fs.readFileSync(fullPath, "utf8").trim();
      if (!sql) {
        continue;
      }

      await db.run(sql);

      const now = new Date().toISOString();
      await db.run(`
        INSERT INTO schema_migrations (filename, appliedAt)
        VALUES ('${file.replace(/'/g, "''")}', '${now}');
      `);

      console.log(`Migration applied: ${file}`);
    }
  } finally {
    await db.close();
  }
}
