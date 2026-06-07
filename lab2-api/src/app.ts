import express from "express";
import {
  errorHandlerMiddleware,
  notFoundMiddleware,
} from "./middleware/error-handler.middleware.js";
import { requestLoggingMiddleware } from "./middleware/request-logging.middleware.js";
import { commentsRouter } from "./routes/comments.routes.js";
import { reportsRouter } from "./routes/reports.routes.js";
import { usersRouter } from "./routes/users.routes.js";

export function createApp() {
  const app = express();

  app.use(express.json());
  app.use(requestLoggingMiddleware);

  app.get("/health", (_req, res) => {
    res.status(200).json({ ok: true });
  });

  app.use("/api/users", usersRouter);
  app.use("/api/reports", reportsRouter);
  app.use("/api/comments", commentsRouter);

  app.use(notFoundMiddleware);
  app.use(errorHandlerMiddleware);

  return app;
}
