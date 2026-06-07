import type { Request } from "express";
import { ApiError } from "../errors/api-error.js";

export function getRouteParam(req: Request, name: string): string {
  const value = req.params[name];
  if (Array.isArray(value)) {
    return value[0] ?? "";
  }
  return value ?? "";
}

export function parseRouteId(req: Request, name: string): number {
  const raw = getRouteParam(req, name);
  const id = Number.parseInt(raw, 10);

  if (Number.isNaN(id) || id < 1) {
    throw new ApiError(
      404,
      "NOT_FOUND",
      "Resource not found",
      `invalid id: ${raw}`,
    );
  }

  return id;
}
