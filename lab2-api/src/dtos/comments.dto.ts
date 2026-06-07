import {
  assertValid,
  collectErrors,
  requireString,
} from "../validation/validators.js";
import type {
  ReportComment,
  ReportCommentWithDetails,
} from "../types/index.js";

export type CreateCommentRequestDto = {
  reportId: number;
  userId: number;
  body: string;
};

export type UpdateCommentRequestDto = {
  reportId: number;
  userId: number;
  body: string;
};

export type PatchCommentRequestDto = {
  reportId?: number;
  userId?: number;
  body?: string;
};

export type CommentResponseDto = {
  id: number;
  reportId: number;
  userId: number;
  body: string;
};

export type CommentWithDetailsResponseDto = CommentResponseDto & {
  authorName: string;
  reportTitle: string;
};

export type CommentListQuery = {
  reportId?: number;
  userId?: number;
  search?: string;
  sortBy: "id" | "reportId" | "userId";
  sortDir: "asc" | "desc";
  page: number;
  pageSize: number;
};

const SORT_FIELDS = ["id", "reportId", "userId"] as const;

function validatePositiveInt(
  value: unknown,
  field: string,
  partial: boolean,
): ReturnType<typeof collectErrors>[number] | null {
  if (partial && value === undefined) {
    return null;
  }
  const num = Number(value);
  if (!Number.isInteger(num) || num < 1) {
    return { field, message: `${field} must be a positive integer` };
  }
  return null;
}

function validateCommentFields(
  dto: Record<string, unknown>,
  partial: boolean,
): ReturnType<typeof collectErrors> {
  const errors = [];

  const reportIdError = validatePositiveInt(dto.reportId, "reportId", partial);
  if (reportIdError) errors.push(reportIdError);

  const userIdError = validatePositiveInt(dto.userId, "userId", partial);
  if (userIdError) errors.push(userIdError);

  if (!partial || dto.body !== undefined) {
    errors.push(requireString(dto.body, "body", 1, 1000));
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

export function validateCreateCommentDto(
  body: unknown,
): CreateCommentRequestDto {
  const dto = assertObjectBody(body);
  assertValid(validateCommentFields(dto, false));

  return {
    reportId: Number(dto.reportId),
    userId: Number(dto.userId),
    body: (dto.body as string).trim(),
  };
}

export function validateUpdateCommentDto(
  body: unknown,
): UpdateCommentRequestDto {
  const dto = assertObjectBody(body);
  assertValid(validateCommentFields(dto, false));

  return {
    reportId: Number(dto.reportId),
    userId: Number(dto.userId),
    body: (dto.body as string).trim(),
  };
}

export function validatePatchCommentDto(body: unknown): PatchCommentRequestDto {
  const dto = assertObjectBody(body);
  const errors = validateCommentFields(dto, true);

  if (Object.keys(dto).length === 0) {
    errors.push({
      field: "body",
      message: "At least one field must be provided",
    });
  }

  assertValid(errors);

  const result: PatchCommentRequestDto = {};
  if (dto.reportId !== undefined) result.reportId = Number(dto.reportId);
  if (dto.userId !== undefined) result.userId = Number(dto.userId);
  if (dto.body !== undefined) result.body = (dto.body as string).trim();
  return result;
}

export function parseCommentListQuery(
  query: Record<string, unknown>,
): CommentListQuery {
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

  if (query.reportId !== undefined && query.reportId !== "") {
    const reportId = Number(query.reportId);
    if (!Number.isInteger(reportId) || reportId < 1) {
      errors.push({
        field: "reportId",
        message: "reportId must be a positive integer",
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
    reportId:
      query.reportId !== undefined && query.reportId !== ""
        ? Number(query.reportId)
        : undefined,
    userId:
      query.userId !== undefined && query.userId !== ""
        ? Number(query.userId)
        : undefined,
    search:
      typeof query.search === "string" && query.search.trim()
        ? query.search.trim()
        : undefined,
    sortBy: sortByRaw as CommentListQuery["sortBy"],
    sortDir: sortDirRaw as "asc" | "desc",
    page,
    pageSize,
  };
}

export function toCommentResponse(comment: ReportComment): CommentResponseDto {
  return {
    id: comment.id,
    reportId: comment.reportId,
    userId: comment.userId,
    body: comment.body,
  };
}

export function toCommentWithDetailsResponse(
  comment: ReportCommentWithDetails,
): CommentWithDetailsResponseDto {
  return {
    ...toCommentResponse(comment),
    authorName: comment.authorName,
    reportTitle: comment.reportTitle,
  };
}
