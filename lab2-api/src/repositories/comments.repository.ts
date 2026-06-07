import { rethrowDbError } from "../db/db-errors.js";
import { getDb } from "../db/dbClient.js";
import { logSql, pickSortColumn } from "../db/sql.js";
import type { CommentListQuery } from "../dtos/comments.dto.js";
import type {
  ReportComment,
  ReportCommentWithDetails,
} from "../types/index.js";

type CommentRow = {
  id: number;
  reportId: number;
  userId: number;
  body: string;
};

type CommentWithDetailsRow = CommentRow & {
  authorName: string;
  reportTitle: string;
};

type CountRow = {
  total: number;
};

const SORT_COLUMNS = {
  id: "c.id",
  reportId: "c.reportId",
  userId: "c.userId",
};

function mapComment(row: CommentRow): ReportComment {
  return {
    id: row.id,
    reportId: row.reportId,
    userId: row.userId,
    body: row.body,
  };
}

function mapCommentWithDetails(
  row: CommentWithDetailsRow,
): ReportCommentWithDetails {
  return {
    ...mapComment(row),
    authorName: row.authorName,
    reportTitle: row.reportTitle,
  };
}

function buildWhere(query: CommentListQuery): {
  where: string;
  params: unknown[];
} {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (query.reportId !== undefined) {
    conditions.push("c.reportId = ?");
    params.push(query.reportId);
  }
  if (query.userId !== undefined) {
    conditions.push("c.userId = ?");
    params.push(query.userId);
  }
  if (query.search) {
    conditions.push("lower(c.body) LIKE ?");
    params.push(`%${query.search.toLowerCase()}%`);
  }

  const where =
    conditions.length > 0 ? ` WHERE ${conditions.join(" AND ")}` : "";
  return { where, params };
}

export class CommentsRepository {
  async list(
    query: CommentListQuery,
  ): Promise<{ items: ReportCommentWithDetails[]; total: number }> {
    const db = getDb();
    const { where, params } = buildWhere(query);

    const countSql = `
      SELECT COUNT(*) AS total
      FROM ReportComments c
      JOIN Users u ON u.id = c.userId
      JOIN Reports r ON r.id = c.reportId${where};
    `;
    logSql(countSql.trim(), params);
    const countRow = await db.get<CountRow>(countSql, params);
    const total = countRow?.total ?? 0;

    const offset = (query.page - 1) * query.pageSize;
    const sortColumn = pickSortColumn(query.sortBy, SORT_COLUMNS, "c.id");
    const listSql = `
      SELECT
        c.id,
        c.reportId,
        c.userId,
        c.body,
        u.name AS authorName,
        r.title AS reportTitle
      FROM ReportComments c
      JOIN Users u ON u.id = c.userId
      JOIN Reports r ON r.id = c.reportId${where}
      ORDER BY ${sortColumn} ${query.sortDir.toUpperCase()}
      LIMIT ? OFFSET ?;
    `;
    const listParams = [...params, query.pageSize, offset];
    logSql(listSql.trim(), listParams);
    const rows = await db.all<CommentWithDetailsRow>(listSql, listParams);

    return { items: rows.map(mapCommentWithDetails), total };
  }

  async getById(id: number): Promise<ReportComment | undefined> {
    const db = getDb();
    const sql = `
      SELECT id, reportId, userId, body
      FROM ReportComments
      WHERE id = ?;
    `;
    logSql(sql.trim(), [id]);
    const row = await db.get<CommentRow>(sql, [id]);
    return row ? mapComment(row) : undefined;
  }

  async getByIdWithDetails(
    id: number,
  ): Promise<ReportCommentWithDetails | undefined> {
    const db = getDb();
    const sql = `
      SELECT
        c.id,
        c.reportId,
        c.userId,
        c.body,
        u.name AS authorName,
        r.title AS reportTitle
      FROM ReportComments c
      JOIN Users u ON u.id = c.userId
      JOIN Reports r ON r.id = c.reportId
      WHERE c.id = ?;
    `;
    logSql(sql.trim(), [id]);
    const row = await db.get<CommentWithDetailsRow>(sql, [id]);
    return row ? mapCommentWithDetails(row) : undefined;
  }

  async add(
    reportId: number,
    userId: number,
    body: string,
  ): Promise<ReportComment> {
    const db = getDb();
    const sql = `
      INSERT INTO ReportComments (reportId, userId, body)
      VALUES (?, ?, ?);
    `;
    const params = [reportId, userId, body];
    logSql(sql.trim(), params);

    try {
      const result = await db.run(sql, params);
      const created = await this.getById(result.lastID);
      if (!created) {
        throw new Error("Failed to load created comment");
      }
      return created;
    } catch (error) {
      rethrowDbError(error);
    }
  }

  async update(
    id: number,
    patch: Partial<Pick<ReportComment, "body" | "reportId" | "userId">>,
  ): Promise<ReportComment | undefined> {
    const existing = await this.getById(id);
    if (!existing) {
      return undefined;
    }

    const next: ReportComment = { ...existing, ...patch };
    const db = getDb();
    const sql = `
      UPDATE ReportComments
      SET reportId = ?, userId = ?, body = ?
      WHERE id = ?;
    `;
    const params = [next.reportId, next.userId, next.body, id];
    logSql(sql.trim(), params);

    try {
      await db.run(sql, params);
      return this.getById(id);
    } catch (error) {
      rethrowDbError(error);
    }
  }

  async delete(id: number): Promise<boolean> {
    const db = getDb();
    const sql = `DELETE FROM ReportComments WHERE id = ?;`;
    logSql(sql, [id]);

    try {
      const result = await db.run(sql, [id]);
      return result.changes > 0;
    } catch (error) {
      rethrowDbError(error);
    }
  }
}

export const commentsRepository = new CommentsRepository();
