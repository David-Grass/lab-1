import { rethrowDbError } from "../db/db-errors.js";
import { getDb } from "../db/dbClient.js";
import { logSql, sqlNum, sqlString } from "../db/sql.js";
import type { User } from "../types/index.js";
import type { UserListQuery } from "../dtos/users.dto.js";

type UserRow = {
  id: number;
  name: string;
  email: string;
};

type CountRow = {
  total: number;
};

function mapUser(row: UserRow): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
  };
}

export class UsersRepository {
  async list(query: UserListQuery): Promise<{ items: User[]; total: number }> {
    const db = getDb();
    const conditions: string[] = [];

    if (query.search) {
      const term = query.search.toLowerCase();
      conditions.push(
        `(lower(name) LIKE '%${term.replace(/'/g, "''")}%' OR lower(email) LIKE '%${term.replace(/'/g, "''")}%')`,
      );
    }

    const where =
      conditions.length > 0 ? ` WHERE ${conditions.join(" AND ")}` : "";

    const countSql = `SELECT COUNT(*) AS total FROM Users${where};`;
    logSql(countSql);
    const countRow = await db.get<CountRow>(countSql);
    const total = countRow?.total ?? 0;

    const offset = (query.page - 1) * query.pageSize;
    const listSql = `
      SELECT id, name, email
      FROM Users${where}
      ORDER BY ${query.sortBy} ${query.sortDir.toUpperCase()}
      LIMIT ${sqlNum(query.pageSize)} OFFSET ${sqlNum(offset)};
    `;
    logSql(listSql.trim());
    const rows = await db.all<UserRow>(listSql);

    return { items: rows.map(mapUser), total };
  }

  async getById(id: number): Promise<User | undefined> {
    const db = getDb();
    const sql = `SELECT id, name, email FROM Users WHERE id = ${sqlNum(id)};`;
    logSql(sql);
    const row = await db.get<UserRow>(sql);
    return row ? mapUser(row) : undefined;
  }

  async getByEmail(email: string): Promise<User | undefined> {
    const db = getDb();
    const sql = `SELECT id, name, email FROM Users WHERE lower(email) = lower(${sqlString(email)});`;
    logSql(sql);
    const row = await db.get<UserRow>(sql);
    return row ? mapUser(row) : undefined;
  }

  async add(name: string, email: string): Promise<User> {
    const db = getDb();
    const sql = `
      INSERT INTO Users (name, email)
      VALUES (${sqlString(name)}, ${sqlString(email)});
    `;
    logSql(sql.trim());

    try {
      const result = await db.run(sql);
      const created = await this.getById(result.lastID);
      if (!created) {
        throw new Error("Failed to load created user");
      }
      return created;
    } catch (error) {
      rethrowDbError(error);
    }
  }

  async update(
    id: number,
    patch: Partial<Pick<User, "name" | "email">>,
  ): Promise<User | undefined> {
    const existing = await this.getById(id);
    if (!existing) {
      return undefined;
    }

    const nextName = patch.name ?? existing.name;
    const nextEmail = patch.email ?? existing.email;

    const db = getDb();
    const sql = `
      UPDATE Users
      SET name = ${sqlString(nextName)}, email = ${sqlString(nextEmail)}
      WHERE id = ${sqlNum(id)};
    `;
    logSql(sql.trim());

    try {
      await db.run(sql);
      return this.getById(id);
    } catch (error) {
      rethrowDbError(error);
    }
  }

  async delete(id: number): Promise<boolean> {
    const db = getDb();
    const sql = `DELETE FROM Users WHERE id = ${sqlNum(id)};`;
    logSql(sql);

    try {
      const result = await db.run(sql);
      return result.changes > 0;
    } catch (error) {
      rethrowDbError(error);
    }
  }
}

export const usersRepository = new UsersRepository();
