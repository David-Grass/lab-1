import type { NextFunction, Request, Response } from "express";
import type {
  CreateUserRequestDto,
  PatchUserRequestDto,
  UpdateUserRequestDto,
} from "../dtos/users.dto.js";
import { usersService } from "../services/users.service.js";
import { parseRouteId } from "../utils/params.js";

export class UsersController {
  list(_req: Request, res: Response, next: NextFunction): void {
    try {
      res.status(200).json(usersService.list());
    } catch (error) {
      next(error);
    }
  }

  getById(req: Request, res: Response, next: NextFunction): void {
    try {
      res.status(200).json(usersService.getById(parseRouteId(req, "id")));
    } catch (error) {
      next(error);
    }
  }

  create(req: Request, res: Response, next: NextFunction): void {
    try {
      const dto = req.body as CreateUserRequestDto;
      res.status(201).json(usersService.create(dto));
    } catch (error) {
      next(error);
    }
  }

  update(req: Request, res: Response, next: NextFunction): void {
    try {
      const dto = req.body as UpdateUserRequestDto;
      res.status(200).json(usersService.update(parseRouteId(req, "id"), dto));
    } catch (error) {
      next(error);
    }
  }

  patch(req: Request, res: Response, next: NextFunction): void {
    try {
      const dto = req.body as PatchUserRequestDto;
      res.status(200).json(usersService.patch(parseRouteId(req, "id"), dto));
    } catch (error) {
      next(error);
    }
  }

  delete(req: Request, res: Response, next: NextFunction): void {
    try {
      usersService.delete(parseRouteId(req, "id"));
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export const usersController = new UsersController();
