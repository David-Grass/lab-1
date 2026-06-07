import type { NextFunction, Request, Response } from "express";

export function validateBody<T>(validator: (body: unknown) => T) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      req.body = validator(req.body);
      next();
    } catch (error) {
      next(error);
    }
  };
}

export function validateQuery<T>(
  validator: (query: Record<string, unknown>) => T,
) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      (req as Request & { validatedQuery: T }).validatedQuery = validator(
        req.query as Record<string, unknown>,
      );
      next();
    } catch (error) {
      next(error);
    }
  };
}
