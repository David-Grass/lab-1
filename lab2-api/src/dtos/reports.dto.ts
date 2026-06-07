import {
  STATUSES,
  SEVERITIES,
  type Report,
  type ReportWithAuthor,
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
  userId: number;
  title: string;
  severity: Severity;
  status: Status;
  description: string;
};

export type UpdateReportRequestDto = {
  userId: number;
  title: string;
  severity: Severity;
  status: Status;
  description: string;
};

export type PatchReportRequestDto = {
  userId?: number;
  title?: string;
  severity?: Severity;
  status?: Status;
  description?: string;
};

export type ReportResponseDto = {
  id: number;
  userId: number;
  title: string;
  severity: Severity;
  status: Status;
  description: string;
};

export type ReportWithAuthorResponseDto = ReportResponseDto & {
  authorName: string;
  authorEmail: string;
};

export type ReportListQuery = {
  search?: string;
  severity?: Severity;
  status?: Status;
  userId?: number;
  sortBy: "id" | "title" | "severity" | "status" | "userId" | "authorName";
  sortDir: "asc" | "desc";
  page: number;
  pageSize: number;
};

const SORT_FIELDS = [
  "id",
  "title",
  "severity",
  "status",
  "userId",
  "authorName",
] as const;

function validateUserId(
  value: unknown,
  partial: boolean,
): ReturnType<typeof collectErrors>[number] | null {
  if (partial && value === undefined) {
    return null;
  }
  const num = Number(value);
  if (!Number.isInteger(num) || num < 1) {
    return { field: "userId", message: "userId must be a positive integer" };
  }
  return null;
}

function validateReportFields(
  dto: Record<string, unknown>,
  partial: boolean,
): ReturnType<typeof collectErrors> {
  const errors = [];

  const userIdError = validateUserId(dto.userId, partial);
  if (userIdError) {
    errors.push(userIdError);
  }
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

  return collectErrors(errors);
}

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
    userId: Number(dto.userId),
    title: (dto.title as string).trim(),
    severity: dto.severity as Severity,
    status: (dto.status as Status | undefined) ?? "Open",
    description: (dto.description as string).trim(),
  };
}

export function validateUpdateReportDto(body: unknown): UpdateReportRequestDto {
  const dto = assertObjectBody(body);
  assertValid(validateReportFields(dto, false));

  return {
    userId: Number(dto.userId),
    title: (dto.title as string).trim(),
    severity: dto.severity as Severity,
    status: dto.status as Status,
    description: (dto.description as string).trim(),
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
  if (dto.userId !== undefined) result.userId = Number(dto.userId);
  if (dto.title !== undefined) result.title = (dto.title as string).trim();
  if (dto.severity !== undefined) result.severity = dto.severity as Severity;
  if (dto.status !== undefined) result.status = dto.status as Status;
  if (dto.description !== undefined)
    result.description = (dto.description as string).trim();
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
  if (query.userId !== undefined && query.userId !== "") {
    const userId = Number(query.userId);
    if (!Number.isInteger(userId) || userId < 1) {
      errors.push({
        field: "userId",
        message: "userId must be a positive integer",
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
    userId:
      query.userId !== undefined && query.userId !== ""
        ? Number(query.userId)
        : undefined,
    sortBy: sortByRaw as ReportListQuery["sortBy"],
    sortDir: sortDirRaw as "asc" | "desc",
    page,
    pageSize,
  };
}

export function parseUnsafeSearchQuery(query: Record<string, unknown>): {
  q: string;
} {
  if (typeof query.q !== "string" || !query.q.trim()) {
    assertValid([{ field: "q", message: "Query parameter q is required" }]);
  }
  return { q: (query.q as string).trim() };
}

export function toReportResponse(report: Report): ReportResponseDto {
  return {
    id: report.id,
    userId: report.userId,
    title: report.title,
    severity: report.severity,
    status: report.status,
    description: report.description,
  };
}

export function toReportWithAuthorResponse(
  report: ReportWithAuthor,
): ReportWithAuthorResponseDto {
  return {
    ...toReportResponse(report),
    authorName: report.authorName,
    authorEmail: report.authorEmail,
  };
}
