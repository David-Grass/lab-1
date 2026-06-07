import type { NextFunction, Request, Response } from "express";
import type {
  CommentListQuery,
  CreateCommentRequestDto,
  PatchCommentRequestDto,
  UpdateCommentRequestDto,
} from "../dtos/comments.dto.js";
import { commentsService } from "../services/comments.service.js";
import { parseRouteId } from "../utils/params.js";

type RequestWithQuery<T> = Request & { validatedQuery: T };

export class CommentsController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = (req as RequestWithQuery<CommentListQuery>).validatedQuery;
      const result = await commentsService.list(query);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async getById(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const result = await commentsService.getById(parseRouteId(req, "id"));
      res.status(200).json({ data: result });
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto = req.body as CreateCommentRequestDto;
      const result = await commentsService.create(dto);
      res.status(201).json({ data: result });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto = req.body as UpdateCommentRequestDto;
      const result = await commentsService.update(parseRouteId(req, "id"), dto);
      res.status(200).json({ data: result });
    } catch (error) {
      next(error);
    }
  }

  async patch(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto = req.body as PatchCommentRequestDto;
      const result = await commentsService.patch(parseRouteId(req, "id"), dto);
      res.status(200).json({ data: result });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await commentsService.delete(parseRouteId(req, "id"));
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export const commentsController = new CommentsController();
