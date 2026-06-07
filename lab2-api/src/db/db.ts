import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const DB_PATH = path.resolve(__dirname, "../../data/app.db");
export const MIGRATIONS_DIR = path.resolve(__dirname, "../../migrations");

const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}
