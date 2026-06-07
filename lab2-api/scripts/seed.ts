/**
 * Seed — тестові дані для БД.
 * Запуск: npm run seed
 *
 * Якщо Users порожня — повний seed.
 * Якщо дані вже є — додає XSS-демо коментар для ЛР5 (якщо його ще немає).
 */
import { initDb } from "../src/db/initDb.js";
import { getDb } from "../src/db/dbClient.js";

const XSS_DEMO_BODY = "<img src=x onerror=\"alert('XSS')\">";

async function ensureXssDemoComment(): Promise<void> {
  const db = getDb();
  const existing = await db.get<{ id: number }>(
    "SELECT id FROM ReportComments WHERE body = ? LIMIT 1;",
    [XSS_DEMO_BODY],
  );
  if (existing) {
    console.log("Lab5 XSS demo comment already present.");
    return;
  }

  const report = await db.get<{ id: number }>(
    "SELECT id FROM Reports WHERE title = ? LIMIT 1;",
    ["XSS у формі коментарів"],
  );
  if (!report) {
    console.log("Lab5 XSS demo skipped: report not found.");
    return;
  }

  await db.run(
    "INSERT INTO ReportComments (reportId, userId, body) VALUES (?, ?, ?);",
    [report.id, 1, XSS_DEMO_BODY],
  );
  console.log("Lab5 XSS demo comment added.");
}

async function main(): Promise<void> {
  await initDb();
  const db = getDb();

  const check = await db.get<{ total: number }>(
    "SELECT COUNT(*) AS total FROM Users;",
  );
  if ((check?.total ?? 0) > 0) {
    console.log("Seed skipped: database already has data.");
    await ensureXssDemoComment();
    return;
  }

  await db.run("INSERT INTO Users (name, email) VALUES (?, ?);", [
    "David Hrass",
    "david@example.com",
  ]);
  await db.run("INSERT INTO Users (name, email) VALUES (?, ?);", [
    "Olena Koval",
    "olena@example.com",
  ]);

  await db.run(
    `INSERT INTO Reports (userId, title, severity, status, description)
     VALUES (?, ?, ?, ?, ?);`,
    [
      1,
      "XSS у формі коментарів",
      "High",
      "Open",
      "Можна вставити script-тег у поле коментаря на сторінці новин",
    ],
  );
  await db.run(
    `INSERT INTO Reports (userId, title, severity, status, description)
     VALUES (?, ?, ?, ?, ?);`,
    [
      2,
      "SQL Injection у пошуку",
      "Critical",
      "InProgress",
      "Параметр q у пошуку підставляється в SQL без екранування",
    ],
  );

  await db.run(
    "INSERT INTO ReportComments (reportId, userId, body) VALUES (?, ?, ?);",
    [1, 2, "Підтверджую вразливість."],
  );
  await db.run(
    "INSERT INTO ReportComments (reportId, userId, body) VALUES (?, ?, ?);",
    [1, 1, XSS_DEMO_BODY],
  );

  console.log("Seed complete: 2 users, 2 reports, 2 comments.");
}

main().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
