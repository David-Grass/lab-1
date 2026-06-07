import type { NextFunction, Request, Response } from "express";
import { mapDbError } from "../db/db-errors.js";
import {
  ApiError,
  isSqliteError,
  toErrorBody,
  type ErrorBody,
} from "../errors/api-error.js";
import { isProduction } from "../utils/env.js";

function sanitizeErrorBody(body: ErrorBody): ErrorBody {
  if (!isProduction()) {
    return body;
  }

  return {
    error: {
      code: body.error.code,
      message: body.error.message,
      details: null,
    },
  };
}

export function notFoundMiddleware(req: Request, res: Response): void {
  const body = sanitizeErrorBody(
    toErrorBody("NOT_FOUND", "Route not found", `path=${req.path}`),
  );
  res.status(404).json(body);
}

export function errorHandlerMiddleware(
  err: unknown,
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  void next;

  if (err instanceof ApiError) {
    res.status(err.status).json(sanitizeErrorBody(err.toBody()));
    return;
  }

  if (isSqliteError(err)) {
    const mapped = mapDbError(err);
    res.status(mapped.status).json(sanitizeErrorBody(mapped.toBody()));
    return;
  }

  console.error("Unhandled error:", err);
  res
    .status(500)
    .json(
      sanitizeErrorBody(
        toErrorBody("INTERNAL_SERVER_ERROR", "Unexpected server error"),
      ),
    );
}
