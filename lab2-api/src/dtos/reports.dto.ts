import {
  STATUSES,
  SEVERITIES,
  type Report,
  type Severity,
  type Status,
} from "../types/index.js";
import {
  assertValid,
  collectErrors,
  requireOneOf,
  requireString,
} from "../validation/validators.js";

export type CreateReportRequestDto = {
  title: string;
  severity: Severity;
  status: Status;
  description: string;
  reporter: string;
};

export type UpdateReportRequestDto = {
  title: string;
  severity: Severity;
  status: Status;
  description: string;
  reporter: string;
};

export type PatchReportRequestDto = {
  title?: string;
  severity?: Severity;
  status?: Status;
  description?: string;
  reporter?: string;
};

export type ReportResponseDto = {
  id: number;
  title: string;
  severity: Severity;
  status: Status;
  description: string;
  reporter: string;
};

export type ReportListQuery = {
  search?: string;
  severity?: Severity;
  status?: Status;
  sortBy: "id" | "title" | "severity" | "status" | "reporter";
  sortDir: "asc" | "desc";
  page: number;
  pageSize: number;
};

const SORT_FIELDS = ["id", "title", "severity", "status", "reporter"] as const;

const severityRank: Record<Severity, number> = {
  Low: 1,
  Medium: 2,
  High: 3,
  Critical: 4,
};

function validateReportFields(
  dto: Record<string, unknown>,
  partial: boolean,
): ValidationErrors {
  const errors = [];

  if (!partial || dto.title !== undefined) {
    errors.push(requireString(dto.title, "title", 3, 80));
  }
  if (!partial || dto.severity !== undefined) {
    errors.push(requireOneOf(dto.severity, "severity", SEVERITIES));
  }
  if (!partial || dto.status !== undefined) {
    errors.push(requireOneOf(dto.status, "status", STATUSES));
  }
  if (!partial || dto.description !== undefined) {
    errors.push(requireString(dto.description, "description", 10, 500));
  }
  if (!partial || dto.reporter !== undefined) {
    errors.push(requireString(dto.reporter, "reporter", 2, 40));
  }

  return collectErrors(errors);
}

type ValidationErrors = ReturnType<typeof collectErrors>;

function assertObjectBody(body: unknown): Record<string, unknown> {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    assertValid([
      { field: "body", message: "Request body must be a JSON object" },
    ]);
  }
  return body as Record<string, unknown>;
}

export function validateCreateReportDto(body: unknown): CreateReportRequestDto {
  const dto = assertObjectBody(body);
  const errors = validateReportFields(
    { ...dto, status: dto.status ?? "Open" },
    false,
  );
  assertValid(errors);

  return {
    title: (dto.title as string).trim(),
    severity: dto.severity as Severity,
    status: (dto.status as Status | undefined) ?? "Open",
    description: (dto.description as string).trim(),
    reporter: (dto.reporter as string).trim(),
  };
}

export function validateUpdateReportDto(body: unknown): UpdateReportRequestDto {
  const dto = assertObjectBody(body);
  assertValid(validateReportFields(dto, false));

  return {
    title: (dto.title as string).trim(),
    severity: dto.severity as Severity,
    status: dto.status as Status,
    description: (dto.description as string).trim(),
    reporter: (dto.reporter as string).trim(),
  };
}

export function validatePatchReportDto(body: unknown): PatchReportRequestDto {
  const dto = assertObjectBody(body);
  const errors = validateReportFields(dto, true);

  if (Object.keys(dto).length === 0) {
    errors.push({
      field: "body",
      message: "At least one field must be provided",
    });
  }

  assertValid(errors);

  const result: PatchReportRequestDto = {};
  if (dto.title !== undefined) result.title = (dto.title as string).trim();
  if (dto.severity !== undefined) result.severity = dto.severity as Severity;
  if (dto.status !== undefined) result.status = dto.status as Status;
  if (dto.description !== undefined)
    result.description = (dto.description as string).trim();
  if (dto.reporter !== undefined)
    result.reporter = (dto.reporter as string).trim();
  return result;
}

export function parseReportListQuery(
  query: Record<string, unknown>,
): ReportListQuery {
  const sortByRaw = typeof query.sortBy === "string" ? query.sortBy : "id";
  const sortDirRaw = typeof query.sortDir === "string" ? query.sortDir : "desc";
  const pageRaw = typeof query.page === "string" ? query.page : "1";
  const pageSizeRaw =
    typeof query.pageSize === "string" ? query.pageSize : "10";

  const errors = [];

  if (!SORT_FIELDS.includes(sortByRaw as (typeof SORT_FIELDS)[number])) {
    errors.push({
      field: "sortBy",
      message: `sortBy must be one of: ${SORT_FIELDS.join(", ")}`,
    });
  }
  if (sortDirRaw !== "asc" && sortDirRaw !== "desc") {
    errors.push({ field: "sortDir", message: "sortDir must be asc or desc" });
  }

  const page = Number.parseInt(pageRaw, 10);
  const pageSize = Number.parseInt(pageSizeRaw, 10);
  if (Number.isNaN(page) || page < 1) {
    errors.push({ field: "page", message: "page must be a positive integer" });
  }
  if (Number.isNaN(pageSize) || pageSize < 1 || pageSize > 100) {
    errors.push({
      field: "pageSize",
      message: "pageSize must be between 1 and 100",
    });
  }

  if (query.severity !== undefined && query.severity !== "") {
    const sev = String(query.severity);
    if (!SEVERITIES.includes(sev as Severity)) {
      errors.push({
        field: "severity",
        message: `severity must be one of: ${SEVERITIES.join(", ")}`,
      });
    }
  }
  if (query.status !== undefined && query.status !== "") {
    const st = String(query.status);
    if (!STATUSES.includes(st as Status)) {
      errors.push({
        field: "status",
        message: `status must be one of: ${STATUSES.join(", ")}`,
      });
    }
  }

  assertValid(errors);

  return {
    search:
      typeof query.search === "string" && query.search.trim()
        ? query.search.trim().toLowerCase()
        : undefined,
    severity:
      query.severity && String(query.severity)
        ? (String(query.severity) as Severity)
        : undefined,
    status:
      query.status && String(query.status)
        ? (String(query.status) as Status)
        : undefined,
    sortBy: sortByRaw as ReportListQuery["sortBy"],
    sortDir: sortDirRaw as "asc" | "desc",
    page,
    pageSize,
  };
}

export function toReportResponse(report: Report): ReportResponseDto {
  return {
    id: report.id,
    title: report.title,
    severity: report.severity,
    status: report.status,
    description: report.description,
    reporter: report.reporter,
  };
}

export function compareReports(
  a: Report,
  b: Report,
  sortBy: ReportListQuery["sortBy"],
  sortDir: "asc" | "desc",
): number {
  let first: string | number = a[sortBy];
  let second: string | number = b[sortBy];

  if (sortBy === "severity") {
    first = severityRank[a.severity];
    second = severityRank[b.severity];
  }

  let result: number;
  if (typeof first === "number" && typeof second === "number") {
    result = first - second;
  } else {
    result = String(first).localeCompare(String(second), "uk");
  }

  return sortDir === "asc" ? result : -result;
}
