import {
  assertValid,
  collectErrors,
  requireEmail,
  requireString,
} from "../validation/validators.js";

export type CreateUserRequestDto = {
  name: string;
  email: string;
};

export type UpdateUserRequestDto = {
  name?: string;
  email?: string;
};

export type PatchUserRequestDto = {
  name?: string;
  email?: string;
};

export type UserResponseDto = {
  id: number;
  name: string;
  email: string;
};

export type UserListQuery = {
  search?: string;
  sortBy: "id" | "name" | "email";
  sortDir: "asc" | "desc";
  page: number;
  pageSize: number;
};

const SORT_FIELDS = ["id", "name", "email"] as const;

export function validateCreateUserDto(body: unknown): CreateUserRequestDto {
  if (typeof body !== "object" || body === null) {
    assertValid([
      { field: "body", message: "Request body must be a JSON object" },
    ]);
  }

  const dto = body as Record<string, unknown>;
  const errors = collectErrors([
    requireString(dto.name, "name", 2, 80),
    requireEmail(dto.email, "email"),
  ]);
  assertValid(errors);

  return {
    name: (dto.name as string).trim(),
    email: (dto.email as string).trim().toLowerCase(),
  };
}

export function validateUpdateUserDto(body: unknown): UpdateUserRequestDto {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    assertValid([
      { field: "body", message: "Request body must be a JSON object" },
    ]);
  }

  const dto = body as Record<string, unknown>;
  const errors = [];

  if (dto.name !== undefined) {
    errors.push(requireString(dto.name, "name", 2, 80));
  }
  if (dto.email !== undefined) {
    errors.push(requireEmail(dto.email, "email"));
  }
  if (dto.name === undefined && dto.email === undefined) {
    errors.push({
      field: "body",
      message: "At least one field (name or email) must be provided",
    });
  }

  assertValid(collectErrors(errors));

  const result: UpdateUserRequestDto = {};
  if (dto.name !== undefined) result.name = (dto.name as string).trim();
  if (dto.email !== undefined)
    result.email = (dto.email as string).trim().toLowerCase();
  return result;
}

export function validatePatchUserDto(body: unknown): PatchUserRequestDto {
  return validateUpdateUserDto(body);
}

export function parseUserListQuery(
  query: Record<string, unknown>,
): UserListQuery {
  const sortByRaw = typeof query.sortBy === "string" ? query.sortBy : "id";
  const sortDirRaw = typeof query.sortDir === "string" ? query.sortDir : "asc";
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

  assertValid(errors);

  return {
    search:
      typeof query.search === "string" && query.search.trim()
        ? query.search.trim()
        : undefined,
    sortBy: sortByRaw as UserListQuery["sortBy"],
    sortDir: sortDirRaw as "asc" | "desc",
    page,
    pageSize,
  };
}

export function toUserResponse(user: {
  id: number;
  name: string;
  email: string;
}): UserResponseDto {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
  };
}
