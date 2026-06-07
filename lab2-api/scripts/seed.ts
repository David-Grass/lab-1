/**
 * Seed — тестові дані для БД (вимога методички, рівень «добре»).
 * Запуск: npm run seed
 *
 * Якщо в Users уже є записи — нічого не додає.
 */
import { initDb } from "../src/db/initDb.js";
import { getDb } from "../src/db/dbClient.js";
import { sqlNum, sqlString } from "../src/db/sql.js";

async function main(): Promise<void> {
  await initDb();
  const db = getDb();

  const check = await db.get<{ total: number }>(
    "SELECT COUNT(*) AS total FROM Users;",
  );
  if ((check?.total ?? 0) > 0) {
    console.log("Seed skipped: database already has data.");
    return;
  }

  // Users
  await db.run(
    `INSERT INTO Users (name, email) VALUES (${sqlString("David Hrass")}, ${sqlString("david@example.com")});`,
  );
  await db.run(
    `INSERT INTO Users (name, email) VALUES (${sqlString("Olena Koval")}, ${sqlString("olena@example.com")});`,
  );

  // Reports (userId = 1 або 2)
  await db.run(`
    INSERT INTO Reports (userId, title, severity, status, description)
    VALUES (
      ${sqlNum(1)},
      ${sqlString("XSS у формі коментарів")},
      ${sqlString("High")},
      ${sqlString("Open")},
      ${sqlString("Можна вставити script-тег у поле коментаря на сторінці новин")}
    );
  `);
  await db.run(`
    INSERT INTO Reports (userId, title, severity, status, description)
    VALUES (
      ${sqlNum(2)},
      ${sqlString("SQL Injection у пошуку")},
      ${sqlString("Critical")},
      ${sqlString("InProgress")},
      ${sqlString("Параметр q у пошуку підставляється в SQL без екранування")}
    );
  `);

  // ReportComments
  await db.run(`
    INSERT INTO ReportComments (reportId, userId, body)
    VALUES (${sqlNum(1)}, ${sqlNum(2)}, ${sqlString("Підтверджую вразливість.")});
  `);
  await db.run(`
    INSERT INTO ReportComments (reportId, userId, body)
    VALUES (${sqlNum(1)}, ${sqlNum(1)}, ${sqlString("Потрібно екранувати HTML на сервері.")});
  `);

  console.log("Seed complete: 2 users, 2 reports, 2 comments.");
}

main().catch((error) => {
  console.error("Seed failed:", error);
  process.exit(1);
});
