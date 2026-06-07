import type { NextFunction, Request, Response } from "express";
import { mapDbError } from "../db/db-errors.js";
import { ApiError, isSqliteError, toErrorBody } from "../errors/api-error.js";

export function notFoundMiddleware(req: Request, res: Response): void {
  res.status(404).json(
    toErrorBody("NOT_FOUND", "Route not found", `path=${req.path}`),
  );
}

export function errorHandlerMiddleware(
  err: unknown,
  _req: Request,
  res: Response,
  next: NextFunction,
): void {
  void next;

  if (err instanceof ApiError) {
    res.status(err.status).json(err.toBody());
    return;
  }

  if (isSqliteError(err)) {
    const mapped = mapDbError(err);
    res.status(mapped.status).json(mapped.toBody());
    return;
  }

  console.error("Unhandled error:", err);
  res.status(500).json(
    toErrorBody("INTERNAL_SERVER_ERROR", "Unexpected server error"),
  );
}
