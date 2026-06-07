import express from "express";
import { corsMiddleware } from "./middleware/cors.middleware.js";
import {
  errorHandlerMiddleware,
  notFoundMiddleware,
} from "./middleware/error-handler.middleware.js";
import { requestLoggingMiddleware } from "./middleware/request-logging.middleware.js";
import { commentsRouter } from "./routes/comments.routes.js";
import { reportsRouter } from "./routes/reports.routes.js";
import { usersRouter } from "./routes/users.routes.js";

function createApiRouter() {
  const router = express.Router();
  router.use("/users", usersRouter);
  router.use("/reports", reportsRouter);
  router.use("/comments", commentsRouter);
  return router;
}

export function createApp() {
  const app = express();

  app.use(corsMiddleware);
  app.options(/.*/, corsMiddleware);
  app.use(express.json());
  app.use(requestLoggingMiddleware);

  app.get("/health", (_req, res) => {
    res.status(200).json({ ok: true });
  });

  const apiRouter = createApiRouter();
  app.use("/api/v1", apiRouter);
  app.use("/api", apiRouter);

  app.use(notFoundMiddleware);
  app.use(errorHandlerMiddleware);

  return app;
}
