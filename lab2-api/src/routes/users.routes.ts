import { Router } from "express";
import {
  parseUserListQuery,
  validateCreateUserDto,
  validatePatchUserDto,
  validateUpdateUserDto,
} from "../dtos/users.dto.js";
import { usersController } from "../controllers/users.controller.js";
import {
  validateBody,
  validateQuery,
} from "../middleware/validate.middleware.js";

export const usersRouter = Router();

usersRouter.get(
  "/",
  validateQuery(parseUserListQuery),
  usersController.list.bind(usersController),
);
usersRouter.get("/:id", usersController.getById.bind(usersController));
usersRouter.post(
  "/",
  validateBody(validateCreateUserDto),
  usersController.create.bind(usersController),
);
usersRouter.put(
  "/:id",
  validateBody(validateUpdateUserDto),
  usersController.update.bind(usersController),
);
usersRouter.patch(
  "/:id",
  validateBody(validatePatchUserDto),
  usersController.patch.bind(usersController),
);
usersRouter.delete("/:id", usersController.delete.bind(usersController));
