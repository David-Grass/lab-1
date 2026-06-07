import { rethrowDbError } from "../db/db-errors.js";
import { getDb } from "../db/dbClient.js";
import { logSql, sqlNum, sqlString } from "../db/sql.js";
import type {
  Report,
  ReportStats,
  ReportWithAuthor,
  Severity,
  Status,
} from "../types/index.js";
import type { ReportListQuery } from "../dtos/reports.dto.js";

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

function buildWhere(query: ReportListQuery): string {
  const conditions: string[] = [];

  if (query.search) {
    const term = query.search.toLowerCase().replace(/'/g, "''");
    conditions.push(
      `(lower(r.title) LIKE '%${term}%' OR lower(r.description) LIKE '%${term}%')`,
    );
  }
  if (query.severity) {
    conditions.push(`r.severity = ${sqlString(query.severity)}`);
  }
  if (query.status) {
    conditions.push(`r.status = ${sqlString(query.status)}`);
  }
  if (query.userId !== undefined) {
    conditions.push(`r.userId = ${sqlNum(query.userId)}`);
  }

  return conditions.length > 0 ? ` WHERE ${conditions.join(" AND ")}` : "";
}

function sortColumn(sortBy: ReportListQuery["sortBy"]): string {
  if (sortBy === "authorName") {
    return "u.name";
  }
  return `r.${sortBy}`;
}

export class ReportsRepository {
  async list(
    query: ReportListQuery,
  ): Promise<{ items: Report[]; total: number }> {
    const db = getDb();
    const where = buildWhere(query);

    const countSql = `SELECT COUNT(*) AS total FROM Reports r${where};`;
    logSql(countSql);
    const countRow = await db.get<CountRow>(countSql);
    const total = countRow?.total ?? 0;

    const offset = (query.page - 1) * query.pageSize;
    const listSql = `
      SELECT r.id, r.userId, r.title, r.severity, r.status, r.description
      FROM Reports r${where}
      ORDER BY ${sortColumn(query.sortBy)} ${query.sortDir.toUpperCase()}
      LIMIT ${sqlNum(query.pageSize)} OFFSET ${sqlNum(offset)};
    `;
    logSql(listSql.trim());
    const rows = await db.all<ReportRow>(listSql);

    return { items: rows.map(mapReport), total };
  }

  async listWithAuthors(
    query: ReportListQuery,
  ): Promise<{ items: ReportWithAuthor[]; total: number }> {
    const db = getDb();
    const where = buildWhere(query);

    const countSql = `
      SELECT COUNT(*) AS total
      FROM Reports r
      JOIN Users u ON u.id = r.userId${where};
    `;
    logSql(countSql.trim());
    const countRow = await db.get<CountRow>(countSql);
    const total = countRow?.total ?? 0;

    const offset = (query.page - 1) * query.pageSize;
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
      ORDER BY ${sortColumn(query.sortBy)} ${query.sortDir.toUpperCase()}
      LIMIT ${sqlNum(query.pageSize)} OFFSET ${sqlNum(offset)};
    `;
    logSql(listSql.trim());
    const rows = await db.all<ReportWithAuthorRow>(listSql);

    return { items: rows.map(mapReportWithAuthor), total };
  }

  async unsafeSearch(term: string): Promise<ReportWithAuthor[]> {
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
      WHERE r.title LIKE '%${term}%'
         OR r.description LIKE '%${term}%'
         OR u.name LIKE '%${term}%';
    `;
    logSql(sql.trim());
    const rows = await db.all<ReportWithAuthorRow>(sql);
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
      WHERE id = ${sqlNum(id)};
    `;
    logSql(sql.trim());
    const row = await db.get<ReportRow>(sql);
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
      WHERE r.id = ${sqlNum(id)};
    `;
    logSql(sql.trim());
    const row = await db.get<ReportWithAuthorRow>(sql);
    return row ? mapReportWithAuthor(row) : undefined;
  }

  async findDuplicate(
    title: string,
    userId: number,
    excludeId?: number,
  ): Promise<Report | undefined> {
    const db = getDb();
    const exclude =
      excludeId !== undefined ? ` AND id <> ${sqlNum(excludeId)}` : "";
    const sql = `
      SELECT id, userId, title, severity, status, description
      FROM Reports
      WHERE lower(trim(title)) = lower(trim(${sqlString(title)}))
        AND userId = ${sqlNum(userId)}${exclude}
      LIMIT 1;
    `;
    logSql(sql.trim());
    const row = await db.get<ReportRow>(sql);
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
      VALUES (
        ${sqlNum(userId)},
        ${sqlString(title)},
        ${sqlString(severity)},
        ${sqlString(status)},
        ${sqlString(description)}
      );
    `;
    logSql(sql.trim());

    try {
      const result = await db.run(sql);
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
      SET
        userId = ${sqlNum(next.userId)},
        title = ${sqlString(next.title)},
        severity = ${sqlString(next.severity)},
        status = ${sqlString(next.status)},
        description = ${sqlString(next.description)}
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
    const sql = `DELETE FROM Reports WHERE id = ${sqlNum(id)};`;
    logSql(sql);

    try {
      const result = await db.run(sql);
      return result.changes > 0;
    } catch (error) {
      rethrowDbError(error);
    }
  }
}

export const reportsRepository = new ReportsRepository();
