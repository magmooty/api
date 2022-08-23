import { config, metrics, wrapper } from "@/components";
import { AppError } from "@/errors";
import { Context } from "@/tracing";
import express, { Request } from "express";
import "express-async-errors";
import { authMiddleware } from "./auth/middleware";
import { APINextFunction, APIRequest, APIResponse } from "./types";
import authRouter from "@/api/auth";
import bodyParser from "body-parser";

const errorHandler = (
  error: Error | AppError,
  req: APIRequest,
  res: APIResponse,
  next: APINextFunction
) => {
  if (error instanceof AppError) {
    res.status(error.statusCode).json({
      code: error.name,
      message: error.message,
      status: error.statusCode,
    });
  } else {
    res.status(500).json({
      code: "UnknownError",
      message: error.message,
      status: "500",
    });
  }

  next();
};

export const init = wrapper(
  { name: "init", file: __filename },
  async (ctx: Context) => {
    const app = express();

    // Security measures
    app.disable("x-powered-by");

    // Config middlewares
    metrics.installApp(app);
    app.use(bodyParser.json());

    // Public endpoints
    app.use("/auth", authRouter);

    // Auth middleware
    app.use(authMiddleware);

    // Private middleware
    app.get("/hello-world", (req, res) => {
      res.json({ hello: "world2" });
    });

    // Error handler
    app.use(errorHandler);

    // Start the server
    const { port } = config.server;

    app.listen(port);

    ctx.log.info(`Server listening on port ${port}`);
  }
);
