export type ErrorDetails = string | null;

export type ErrorBody = {
  error: {
    code: string;
    message: string;
    details: ErrorDetails;
  };
};

export function toErrorBody(
  code: string,
  message: string,
  details: ErrorDetails = null,
): ErrorBody {
  return { error: { code, message, details } };
}

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details: ErrorDetails;

  constructor(
    status: number,
    code: string,
    message: string,
    details: ErrorDetails = null,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }

  toBody(): ErrorBody {
    return toErrorBody(this.code, this.message, this.details);
  }
}

export function isSqliteError(error: unknown): error is Error {
  return error instanceof Error && error.message.includes("SQLITE_CONSTRAINT");
}
