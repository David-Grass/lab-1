import { ApiError } from "../errors/api-error.js";

export function mapDbError(error: unknown): ApiError {
  if (!(error instanceof Error)) {
    return new ApiError(
      500,
      "INTERNAL_SERVER_ERROR",
      "Unexpected database error",
    );
  }

  const details = error.message;

  if (details.includes("SQLITE_CONSTRAINT: UNIQUE")) {
    return new ApiError(
      409,
      "UNIQUE_CONSTRAINT",
      "Unique constraint violation",
      details,
    );
  }

  if (details.includes("SQLITE_CONSTRAINT: NOT NULL")) {
    return new ApiError(
      400,
      "NOT_NULL_CONSTRAINT",
      "Required field is missing",
      details,
    );
  }

  if (details.includes("SQLITE_CONSTRAINT: FOREIGN KEY")) {
    return new ApiError(
      400,
      "FOREIGN_KEY_CONSTRAINT",
      "Foreign key constraint violation",
      details,
    );
  }

  if (details.includes("SQLITE_CONSTRAINT: CHECK")) {
    return new ApiError(
      400,
      "CHECK_CONSTRAINT",
      "Check constraint violation",
      details,
    );
  }

  return new ApiError(
    500,
    "INTERNAL_SERVER_ERROR",
    "Database operation failed",
    details,
  );
}

export function rethrowDbError(error: unknown): never {
  throw mapDbError(error);
}
