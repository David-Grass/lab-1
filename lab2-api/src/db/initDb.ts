import { initDbClient } from "./dbClient.js";
import { migrate } from "./migrate.js";

export async function initDb(): Promise<void> {
  await migrate();
  initDbClient();
  console.log("DB schema initialized");
}
