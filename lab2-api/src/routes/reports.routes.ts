import { Router } from "express";
import {
  parseReportListQuery,
  parseUnsafeSearchQuery,
  validateCreateReportDto,
  validatePatchReportDto,
  validateUpdateReportDto,
} from "../dtos/reports.dto.js";
import { reportsController } from "../controllers/reports.controller.js";
import { demoAuthMiddleware } from "../middleware/demo-auth.middleware.js";
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
  reportsController.search.bind(reportsController),
);
reportsRouter.get(
  "/",
  validateQuery(parseReportListQuery),
  reportsController.list.bind(reportsController),
);

reportsRouter.get(
  "/:id",
  demoAuthMiddleware,
  reportsController.getById.bind(reportsController),
);
reportsRouter.post(
  "/",
  demoAuthMiddleware,
  validateBody(validateCreateReportDto),
  reportsController.create.bind(reportsController),
);
reportsRouter.put(
  "/:id",
  demoAuthMiddleware,
  validateBody(validateUpdateReportDto),
  reportsController.update.bind(reportsController),
);
reportsRouter.patch(
  "/:id",
  demoAuthMiddleware,
  validateBody(validatePatchReportDto),
  reportsController.patch.bind(reportsController),
);
reportsRouter.delete(
  "/:id",
  demoAuthMiddleware,
  reportsController.delete.bind(reportsController),
);
