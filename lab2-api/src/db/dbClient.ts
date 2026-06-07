import { createRequire } from "node:module";
import type { Database } from "sqlite3";
import { DB_PATH } from "./db.js";

const require = createRequire(import.meta.url);
const sqlite3 = require("sqlite3") as typeof import("sqlite3");

export type RunResult = {
  lastID: number;
  changes: number;
};

export class DbClient {
  private readonly db: Database;

  constructor(dbPath: string = DB_PATH) {
    this.db = new sqlite3.Database(dbPath);
  }

  async run(sql: string): Promise<RunResult> {
    return new Promise((resolve, reject) => {
      this.db.run(
        sql,
        function onRun(this: { lastID: number; changes: number }, err) {
          if (err) {
            reject(err);
            return;
          }
          resolve({ lastID: this.lastID, changes: this.changes });
        },
      );
    });
  }

  async get<T>(sql: string): Promise<T | undefined> {
    return new Promise((resolve, reject) => {
      this.db.get(sql, (err, row) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(row as T | undefined);
      });
    });
  }

  async all<T>(sql: string): Promise<T[]> {
    return new Promise((resolve, reject) => {
      this.db.all(sql, (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        resolve((rows ?? []) as T[]);
      });
    });
  }

  async close(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.db.close((err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });
  }
}

let client: DbClient | undefined;

export function getDb(): DbClient {
  if (!client) {
    throw new Error("Database is not initialized. Call initDbClient() first.");
  }
  return client;
}

export function initDbClient(dbPath: string = DB_PATH): DbClient {
  client = new DbClient(dbPath);
  return client;
}

export async function closeDbClient(): Promise<void> {
  if (client) {
    await client.close();
    client = undefined;
  }
}
