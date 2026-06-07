import { Router } from "express";
import {
  parseReportListQuery,
  parseUnsafeSearchQuery,
  validateCreateReportDto,
  validatePatchReportDto,
  validateUpdateReportDto,
} from "../dtos/reports.dto.js";
import { reportsController } from "../controllers/reports.controller.js";
import {
  validateBody,
  validateQuery,
} from "../middleware/validate.middleware.js";

export const reportsRouter = Router();

reportsRouter.get(
  "/with-authors",
  validateQuery(parseReportListQuery),
  reportsController.listWithAuthors.bind(reportsController),
);
reportsRouter.get("/stats", reportsController.stats.bind(reportsController));
reportsRouter.get(
  "/search",
  validateQuery(parseUnsafeSearchQuery),
  reportsController.unsafeSearch.bind(reportsController),
);
reportsRouter.get(
  "/",
  validateQuery(parseReportListQuery),
  reportsController.list.bind(reportsController),
);
reportsRouter.get("/:id", reportsController.getById.bind(reportsController));
reportsRouter.post(
  "/",
  validateBody(validateCreateReportDto),
  reportsController.create.bind(reportsController),
);
reportsRouter.put(
  "/:id",
  validateBody(validateUpdateReportDto),
  reportsController.update.bind(reportsController),
);
reportsRouter.patch(
  "/:id",
  validateBody(validatePatchReportDto),
  reportsController.patch.bind(reportsController),
);
reportsRouter.delete("/:id", reportsController.delete.bind(reportsController));
