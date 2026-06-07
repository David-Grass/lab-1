export function esc(s: string): string {
  return s.replace(/'/g, "''");
}

export function sqlString(s: string): string {
  return `'${esc(s)}'`;
}

export function sqlNum(n: number): string {
  if (!Number.isFinite(n)) {
    throw new Error("Invalid SQL number");
  }
  return String(Math.trunc(n));
}

export function logSql(sql: string): void {
  console.log("[SQL]", sql);
}
