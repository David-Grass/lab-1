import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../errors/api-error.js";
import { usersRepository } from "../repositories/users.repository.js";

export async function demoAuthMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const raw = req.header("X-Demo-UserId");
    if (!raw) {
      throw new ApiError(
        401,
        "UNAUTHORIZED",
        "Missing X-Demo-UserId header",
        null,
      );
    }

    const userId = Number(raw);
    if (!Number.isInteger(userId) || userId < 1) {
      throw new ApiError(
        401,
        "UNAUTHORIZED",
        "Invalid X-Demo-UserId header",
        null,
      );
    }

    const user = await usersRepository.getById(userId);
    if (!user) {
      throw new ApiError(401, "UNAUTHORIZED", "Unknown demo user", null);
    }

    req.demoUser = { id: userId };
    next();
  } catch (error) {
    next(error);
  }
}
