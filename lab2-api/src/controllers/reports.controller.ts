import type { NextFunction, Request, Response } from "express";
import type {
  CreateReportRequestDto,
  PatchReportRequestDto,
  ReportListQuery,
  UpdateReportRequestDto,
} from "../dtos/reports.dto.js";
import { reportsService } from "../services/reports.service.js";
import { parseRouteId } from "../utils/params.js";

type RequestWithQuery<T> = Request & { validatedQuery: T };

export class ReportsController {
  list(req: Request, res: Response, next: NextFunction): void {
    try {
      const query = (req as RequestWithQuery<ReportListQuery>).validatedQuery;
      res.status(200).json(reportsService.list(query));
    } catch (error) {
      next(error);
    }
  }

  getById(req: Request, res: Response, next: NextFunction): void {
    try {
      res.status(200).json(reportsService.getById(parseRouteId(req, "id")));
    } catch (error) {
      next(error);
    }
  }

  create(req: Request, res: Response, next: NextFunction): void {
    try {
      const dto = req.body as CreateReportRequestDto;
      res.status(201).json(reportsService.create(dto));
    } catch (error) {
      next(error);
    }
  }

  update(req: Request, res: Response, next: NextFunction): void {
    try {
      const dto = req.body as UpdateReportRequestDto;
      res.status(200).json(reportsService.update(parseRouteId(req, "id"), dto));
    } catch (error) {
      next(error);
    }
  }

  patch(req: Request, res: Response, next: NextFunction): void {
    try {
      const dto = req.body as PatchReportRequestDto;
      res.status(200).json(reportsService.patch(parseRouteId(req, "id"), dto));
    } catch (error) {
      next(error);
    }
  }

  delete(req: Request, res: Response, next: NextFunction): void {
    try {
      reportsService.delete(parseRouteId(req, "id"));
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}

export const reportsController = new ReportsController();
