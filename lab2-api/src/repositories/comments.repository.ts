import { rethrowDbError } from "../db/db-errors.js";
import { getDb } from "../db/dbClient.js";
import { logSql, sqlNum, sqlString } from "../db/sql.js";
import type {
  ReportComment,
  ReportCommentWithDetails,
} from "../types/index.js";
import type { CommentListQuery } from "../dtos/comments.dto.js";

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

function buildWhere(query: CommentListQuery): string {
  const conditions: string[] = [];

  if (query.reportId !== undefined) {
    conditions.push(`c.reportId = ${sqlNum(query.reportId)}`);
  }
  if (query.userId !== undefined) {
    conditions.push(`c.userId = ${sqlNum(query.userId)}`);
  }
  if (query.search) {
    const term = query.search.toLowerCase().replace(/'/g, "''");
    conditions.push(`lower(c.body) LIKE '%${term}%'`);
  }

  return conditions.length > 0 ? ` WHERE ${conditions.join(" AND ")}` : "";
}

export class CommentsRepository {
  async list(
    query: CommentListQuery,
  ): Promise<{ items: ReportCommentWithDetails[]; total: number }> {
    const db = getDb();
    const where = buildWhere(query);

    const countSql = `
      SELECT COUNT(*) AS total
      FROM ReportComments c
      JOIN Users u ON u.id = c.userId
      JOIN Reports r ON r.id = c.reportId${where};
    `;
    logSql(countSql.trim());
    const countRow = await db.get<CountRow>(countSql);
    const total = countRow?.total ?? 0;

    const offset = (query.page - 1) * query.pageSize;
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
      ORDER BY c.${query.sortBy} ${query.sortDir.toUpperCase()}
      LIMIT ${sqlNum(query.pageSize)} OFFSET ${sqlNum(offset)};
    `;
    logSql(listSql.trim());
    const rows = await db.all<CommentWithDetailsRow>(listSql);

    return { items: rows.map(mapCommentWithDetails), total };
  }

  async getById(id: number): Promise<ReportComment | undefined> {
    const db = getDb();
    const sql = `
      SELECT id, reportId, userId, body
      FROM ReportComments
      WHERE id = ${sqlNum(id)};
    `;
    logSql(sql.trim());
    const row = await db.get<CommentRow>(sql);
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
      WHERE c.id = ${sqlNum(id)};
    `;
    logSql(sql.trim());
    const row = await db.get<CommentWithDetailsRow>(sql);
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
      VALUES (${sqlNum(reportId)}, ${sqlNum(userId)}, ${sqlString(body)});
    `;
    logSql(sql.trim());

    try {
      const result = await db.run(sql);
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
      SET
        reportId = ${sqlNum(next.reportId)},
        userId = ${sqlNum(next.userId)},
        body = ${sqlString(next.body)}
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
    const sql = `DELETE FROM ReportComments WHERE id = ${sqlNum(id)};`;
    logSql(sql);

    try {
      const result = await db.run(sql);
      return result.changes > 0;
    } catch (error) {
      rethrowDbError(error);
    }
  }
}

export const commentsRepository = new CommentsRepository();
