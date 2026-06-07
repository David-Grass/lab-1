import { rethrowDbError } from "../db/db-errors.js";
import { getDb } from "../db/dbClient.js";
import { logSql, pickSortColumn } from "../db/sql.js";
import type { UserListQuery } from "../dtos/users.dto.js";
import type { User } from "../types/index.js";

type UserRow = {
  id: number;
  name: string;
  email: string;
};

type CountRow = {
  total: number;
};

const SORT_COLUMNS = {
  id: "id",
  name: "name",
  email: "email",
};

function mapUser(row: UserRow): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
  };
}

function buildWhere(query: UserListQuery): {
  where: string;
  params: unknown[];
} {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (query.search) {
    conditions.push("(lower(name) LIKE ? OR lower(email) LIKE ?)");
    const term = `%${query.search.toLowerCase()}%`;
    params.push(term, term);
  }

  const where =
    conditions.length > 0 ? ` WHERE ${conditions.join(" AND ")}` : "";
  return { where, params };
}

export class UsersRepository {
  async list(query: UserListQuery): Promise<{ items: User[]; total: number }> {
    const db = getDb();
    const { where, params } = buildWhere(query);

    const countSql = `SELECT COUNT(*) AS total FROM Users${where};`;
    logSql(countSql, params);
    const countRow = await db.get<CountRow>(countSql, params);
    const total = countRow?.total ?? 0;

    const offset = (query.page - 1) * query.pageSize;
    const sortColumn = pickSortColumn(query.sortBy, SORT_COLUMNS, "id");
    const listSql = `
      SELECT id, name, email
      FROM Users${where}
      ORDER BY ${sortColumn} ${query.sortDir.toUpperCase()}
      LIMIT ? OFFSET ?;
    `;
    const listParams = [...params, query.pageSize, offset];
    logSql(listSql.trim(), listParams);
    const rows = await db.all<UserRow>(listSql, listParams);

    return { items: rows.map(mapUser), total };
  }

  async getById(id: number): Promise<User | undefined> {
    const db = getDb();
    const sql = `SELECT id, name, email FROM Users WHERE id = ?;`;
    logSql(sql, [id]);
    const row = await db.get<UserRow>(sql, [id]);
    return row ? mapUser(row) : undefined;
  }

  async getByEmail(email: string): Promise<User | undefined> {
    const db = getDb();
    const sql = `SELECT id, name, email FROM Users WHERE lower(email) = lower(?);`;
    logSql(sql, [email]);
    const row = await db.get<UserRow>(sql, [email]);
    return row ? mapUser(row) : undefined;
  }

  async add(name: string, email: string): Promise<User> {
    const db = getDb();
    const sql = `INSERT INTO Users (name, email) VALUES (?, ?);`;
    logSql(sql, [name, email]);

    try {
      const result = await db.run(sql, [name, email]);
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
    const sql = `UPDATE Users SET name = ?, email = ? WHERE id = ?;`;
    logSql(sql, [nextName, nextEmail, id]);

    try {
      await db.run(sql, [nextName, nextEmail, id]);
      return this.getById(id);
    } catch (error) {
      rethrowDbError(error);
    }
  }

  async delete(id: number): Promise<boolean> {
    const db = getDb();
    const sql = `DELETE FROM Users WHERE id = ?;`;
    logSql(sql, [id]);

    try {
      const result = await db.run(sql, [id]);
      return result.changes > 0;
    } catch (error) {
      rethrowDbError(error);
    }
  }
}

export const usersRepository = new UsersRepository();
