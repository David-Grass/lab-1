import { rethrowDbError } from "../db/db-errors.js";
import { getDb } from "../db/dbClient.js";
import { logSql, pickSortColumn } from "../db/sql.js";
import type { ReportListQuery } from "../dtos/reports.dto.js";
import type {
  Report,
  ReportStats,
  ReportWithAuthor,
  Severity,
  Status,
} from "../types/index.js";

type ReportRow = {
  id: number;
  userId: number;
  title: string;
  severity: Severity;
  status: Status;
  description: string;
};

type ReportWithAuthorRow = ReportRow & {
  authorName: string;
  authorEmail: string;
};

type CountRow = {
  total: number;
};

type SeverityCountRow = {
  severity: Severity;
  count: number;
};

type StatusCountRow = {
  status: Status;
  count: number;
};

type AvgRow = {
  avgComments: number | null;
};

const SORT_COLUMNS = {
  id: "r.id",
  title: "r.title",
  severity: "r.severity",
  status: "r.status",
  authorName: "u.name",
};

function mapReport(row: ReportRow): Report {
  return {
    id: row.id,
    userId: row.userId,
    title: row.title,
    severity: row.severity,
    status: row.status,
    description: row.description,
  };
}

function mapReportWithAuthor(row: ReportWithAuthorRow): ReportWithAuthor {
  return {
    ...mapReport(row),
    authorName: row.authorName,
    authorEmail: row.authorEmail,
  };
}

function buildWhere(query: ReportListQuery): {
  where: string;
  params: unknown[];
} {
  const conditions: string[] = [];
  const params: unknown[] = [];

  if (query.search) {
    conditions.push("(lower(r.title) LIKE ? OR lower(r.description) LIKE ?)");
    const term = `%${query.search.toLowerCase()}%`;
    params.push(term, term);
  }
  if (query.severity) {
    conditions.push("r.severity = ?");
    params.push(query.severity);
  }
  if (query.status) {
    conditions.push("r.status = ?");
    params.push(query.status);
  }
  if (query.userId !== undefined) {
    conditions.push("r.userId = ?");
    params.push(query.userId);
  }

  const where =
    conditions.length > 0 ? ` WHERE ${conditions.join(" AND ")}` : "";
  return { where, params };
}

export class ReportsRepository {
  async list(
    query: ReportListQuery,
  ): Promise<{ items: Report[]; total: number }> {
    const db = getDb();
    const { where, params } = buildWhere(query);

    const countSql = `SELECT COUNT(*) AS total FROM Reports r${where};`;
    logSql(countSql, params);
    const countRow = await db.get<CountRow>(countSql, params);
    const total = countRow?.total ?? 0;

    const offset = (query.page - 1) * query.pageSize;
    const sortColumn = pickSortColumn(query.sortBy, SORT_COLUMNS, "r.id");
    const listSql = `
      SELECT r.id, r.userId, r.title, r.severity, r.status, r.description
      FROM Reports r${where}
      ORDER BY ${sortColumn} ${query.sortDir.toUpperCase()}
      LIMIT ? OFFSET ?;
    `;
    const listParams = [...params, query.pageSize, offset];
    logSql(listSql.trim(), listParams);
    const rows = await db.all<ReportRow>(listSql, listParams);

    return { items: rows.map(mapReport), total };
  }

  async listWithAuthors(
    query: ReportListQuery,
  ): Promise<{ items: ReportWithAuthor[]; total: number }> {
    const db = getDb();
    const { where, params } = buildWhere(query);

    const countSql = `
      SELECT COUNT(*) AS total
      FROM Reports r
      JOIN Users u ON u.id = r.userId${where};
    `;
    logSql(countSql.trim(), params);
    const countRow = await db.get<CountRow>(countSql, params);
    const total = countRow?.total ?? 0;

    const offset = (query.page - 1) * query.pageSize;
    const sortColumn = pickSortColumn(query.sortBy, SORT_COLUMNS, "r.id");
    const listSql = `
      SELECT
        r.id,
        r.userId,
        r.title,
        r.severity,
        r.status,
        r.description,
        u.name AS authorName,
        u.email AS authorEmail
      FROM Reports r
      JOIN Users u ON u.id = r.userId${where}
      ORDER BY ${sortColumn} ${query.sortDir.toUpperCase()}
      LIMIT ? OFFSET ?;
    `;
    const listParams = [...params, query.pageSize, offset];
    logSql(listSql.trim(), listParams);
    const rows = await db.all<ReportWithAuthorRow>(listSql, listParams);

    return { items: rows.map(mapReportWithAuthor), total };
  }

  async search(term: string): Promise<ReportWithAuthor[]> {
    const db = getDb();
    const pattern = `%${term}%`;
    const sql = `
      SELECT
        r.id,
        r.userId,
        r.title,
        r.severity,
        r.status,
        r.description,
        u.name AS authorName,
        u.email AS authorEmail
      FROM Reports r
      JOIN Users u ON u.id = r.userId
      WHERE r.title LIKE ?
         OR r.description LIKE ?
         OR u.name LIKE ?;
    `;
    const params = [pattern, pattern, pattern];
    logSql(sql.trim(), params);
    const rows = await db.all<ReportWithAuthorRow>(sql, params);
    return rows.map(mapReportWithAuthor);
  }

  async getStats(): Promise<ReportStats> {
    const db = getDb();

    const totalSql = "SELECT COUNT(*) AS total FROM Reports;";
    logSql(totalSql);
    const totalRow = await db.get<CountRow>(totalSql);
    const total = totalRow?.total ?? 0;

    const severitySql = `
      SELECT severity, COUNT(*) AS count
      FROM Reports
      GROUP BY severity;
    `;
    logSql(severitySql.trim());
    const severityRows = await db.all<SeverityCountRow>(severitySql);

    const statusSql = `
      SELECT status, COUNT(*) AS count
      FROM Reports
      GROUP BY status;
    `;
    logSql(statusSql.trim());
    const statusRows = await db.all<StatusCountRow>(statusSql);

    const avgSql = `
      SELECT AVG(commentCount) AS avgComments
      FROM (
        SELECT r.id, COUNT(c.id) AS commentCount
        FROM Reports r
        LEFT JOIN ReportComments c ON c.reportId = r.id
        GROUP BY r.id
      );
    `;
    logSql(avgSql.trim());
    const avgRow = await db.get<AvgRow>(avgSql);

    const bySeverity = {
      Low: 0,
      Medium: 0,
      High: 0,
      Critical: 0,
    };
    for (const row of severityRows) {
      bySeverity[row.severity] = row.count;
    }

    const byStatus = {
      Open: 0,
      InProgress: 0,
      Resolved: 0,
      Closed: 0,
    };
    for (const row of statusRows) {
      byStatus[row.status] = row.count;
    }

    return {
      total,
      bySeverity,
      byStatus,
      avgCommentsPerReport: avgRow?.avgComments ?? 0,
    };
  }

  async getById(id: number): Promise<Report | undefined> {
    const db = getDb();
    const sql = `
      SELECT id, userId, title, severity, status, description
      FROM Reports
      WHERE id = ?;
    `;
    logSql(sql.trim(), [id]);
    const row = await db.get<ReportRow>(sql, [id]);
    return row ? mapReport(row) : undefined;
  }

  async getByIdWithAuthor(id: number): Promise<ReportWithAuthor | undefined> {
    const db = getDb();
    const sql = `
      SELECT
        r.id,
        r.userId,
        r.title,
        r.severity,
        r.status,
        r.description,
        u.name AS authorName,
        u.email AS authorEmail
      FROM Reports r
      JOIN Users u ON u.id = r.userId
      WHERE r.id = ?;
    `;
    logSql(sql.trim(), [id]);
    const row = await db.get<ReportWithAuthorRow>(sql, [id]);
    return row ? mapReportWithAuthor(row) : undefined;
  }

  async findDuplicate(
    title: string,
    userId: number,
    excludeId?: number,
  ): Promise<Report | undefined> {
    const db = getDb();
    const params: unknown[] = [title, userId];
    let sql = `
      SELECT id, userId, title, severity, status, description
      FROM Reports
      WHERE lower(trim(title)) = lower(trim(?))
        AND userId = ?`;
    if (excludeId !== undefined) {
      sql += " AND id <> ?";
      params.push(excludeId);
    }
    sql += " LIMIT 1;";
    logSql(sql.trim(), params);
    const row = await db.get<ReportRow>(sql, params);
    return row ? mapReport(row) : undefined;
  }

  async add(
    userId: number,
    title: string,
    severity: Severity,
    status: Status,
    description: string,
  ): Promise<Report> {
    const db = getDb();
    const sql = `
      INSERT INTO Reports (userId, title, severity, status, description)
      VALUES (?, ?, ?, ?, ?);
    `;
    const params = [userId, title, severity, status, description];
    logSql(sql.trim(), params);

    try {
      const result = await db.run(sql, params);
      const created = await this.getById(result.lastID);
      if (!created) {
        throw new Error("Failed to load created report");
      }
      return created;
    } catch (error) {
      rethrowDbError(error);
    }
  }

  async update(
    id: number,
    patch: Partial<Omit<Report, "id">>,
  ): Promise<Report | undefined> {
    const existing = await this.getById(id);
    if (!existing) {
      return undefined;
    }

    const next: Report = { ...existing, ...patch };
    const db = getDb();
    const sql = `
      UPDATE Reports
      SET userId = ?, title = ?, severity = ?, status = ?, description = ?
      WHERE id = ?;
    `;
    const params = [
      next.userId,
      next.title,
      next.severity,
      next.status,
      next.description,
      id,
    ];
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
    const sql = `DELETE FROM Reports WHERE id = ?;`;
    logSql(sql, [id]);

    try {
      const result = await db.run(sql, [id]);
      return result.changes > 0;
    } catch (error) {
      rethrowDbError(error);
    }
  }
}

export const reportsRepository = new ReportsRepository();
