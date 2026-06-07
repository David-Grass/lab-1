import type { SqlParams } from "./dbClient.js";

export function logSql(sql: string, params: SqlParams = []): void {
  if (params.length === 0) {
    console.log("[SQL]", sql);
    return;
  }
  console.log("[SQL]", sql, params);
}

/** Allowlist for ORDER BY column identifiers (not parameterizable in SQLite). */
export function pickSortColumn(
  sortBy: string,
  allowed: Record<string, string>,
  fallback: string,
): string {
  return allowed[sortBy] ?? allowed[fallback] ?? fallback;
}
