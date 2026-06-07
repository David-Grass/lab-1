import { Router } from "express";
import {
  parseCommentListQuery,
  validateCreateCommentDto,
  validatePatchCommentDto,
  validateUpdateCommentDto,
} from "../dtos/comments.dto.js";
import { commentsController } from "../controllers/comments.controller.js";
import {
  validateBody,
  validateQuery,
} from "../middleware/validate.middleware.js";

export const commentsRouter = Router();

commentsRouter.get(
  "/",
  validateQuery(parseCommentListQuery),
  commentsController.list.bind(commentsController),
);
commentsRouter.get("/:id", commentsController.getById.bind(commentsController));
commentsRouter.post(
  "/",
  validateBody(validateCreateCommentDto),
  commentsController.create.bind(commentsController),
);
commentsRouter.put(
  "/:id",
  validateBody(validateUpdateCommentDto),
  commentsController.update.bind(commentsController),
);
commentsRouter.patch(
  "/:id",
  validateBody(validatePatchCommentDto),
  commentsController.patch.bind(commentsController),
);
commentsRouter.delete(
  "/:id",
  commentsController.delete.bind(commentsController),
);
