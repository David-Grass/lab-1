import type { NextFunction, Request, Response } from "express";
import type {
  CreateReportRequestDto,
  PatchReportRequestDto,
  ReportListQuery,
  UpdateReportRequestDto,
} from "../dtos/reports.dto.js";
import { ApiError } from "../errors/api-error.js";
import { reportsService } from "../services/reports.service.js";
import { parseRouteId } from "../utils/params.js";

type RequestWithQuery<T> = Request & { validatedQuery: T };

function requireDemoUser(req: Request): number {
  const userId = req.demoUser?.id;
  if (!userId) {
    throw new ApiError(
      401,
      "UNAUTHORIZED",
      "Missing X-Demo-UserId header",
      null,
    );
  }
  return userId;
}

export class ReportsController {
  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const query = (req as RequestWithQuery<ReportListQuery>).validatedQuery;
      const result = await reportsService.list(query);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async listWithAuthors(
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> {
    try {
      const query = (req as RequestWithQuery<ReportListQuery>).validatedQuery;
      const result = await reportsService.listWithAuthors(query);
      res.status(200).json(result);
    } catch (error) {
      next(error);
    }
  }

  async search(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const term = (req as RequestWithQuery<{ q: string }>).validatedQuery.q;
      const data = await reportsService.search(term);
      res.status(200).json({ data });
    } catch (error) {
      next(error);
    }
  }

  async stats(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await reportsService.getStats();
      res.status(200).json({ data });
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
      const result = await reportsService.getByIdWithAuthor(
        parseRouteId(req, "id"),
        requireDemoUser(req),
      );
      res.status(200).json({ data: result });
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto = req.body as CreateReportRequestDto;
      const result = await reportsService.create(dto, requireDemoUser(req));
      res.status(201).json({ data: result });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto = req.body as UpdateReportRequestDto;
      const result = await reportsService.update(
        parseRouteId(req, "id"),
        dto,
        requireDemoUser(req),
      );
      res.status(200).json({ data: result });
    } catch (error) {
      next(error);
    }
  }

  async patch(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const dto = req.body as PatchReportRequestDto;
      const result = await reportsService.patch(
        parseRouteId(req, "id"),
        dto,
        requireDemoUser(req),
      );
      res.status(200).json({ data: result });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await reportsService.delete(
        parseRouteId(req, "id"),
        requireDemoUser(req),
      );
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export const reportsController = new ReportsController();
