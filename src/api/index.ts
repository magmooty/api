import * as authRouters from "@/api/auth";
import * as graphRouters from "@/api/graph";
import * as profileRouters from "@/api/profile";
import * as searchRouters from "@/api/search";
import { config, metrics, wrapper } from "@/components";
import { AppError } from "@/errors";
import { Context } from "@/tracing";
import bodyParser from "body-parser";
import express from "express";
import "express-async-errors";
import { authMiddleware } from "./auth/middleware";
import { APINextFunction, APIRequest, APIResponse } from "./types";
import userAgentBlocker from "express-user-agent-blocker";
import cors from "cors";
import { Server } from "http";

export interface APIConfig {
  virtualsCacheRecheckInterval: number;
  virtualsCacheTimeout: number;
}

export interface ServerConfig {
  port: number;
}

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

let appServer: Server;

export const init = wrapper(
  { name: "init", file: __filename },
  async (ctx: Context) => {
    const app = express();

    // Security measures
    app.disable("x-powered-by");

    // Config middlewares
    metrics.installApp(app);
    app.use(bodyParser.json());
    app.use(cors());

    // Block some user agents
    app.use(userAgentBlocker(["Nmap Scripting Engine"]));

    // Block some requests
    app.get("/", (req, res) => {
      res.send();
    });

    // Public endpoints
    app.use("/auth", authRouters.publicRouter);

    // Auth middleware
    app.use(authMiddleware);

    // Private endpoints
    app.use("/auth", authRouters.privateRouter);
    app.use("/graph", graphRouters.privateRouter);
    app.use("/profile", profileRouters.privateRouter);
    app.use("/search", searchRouters.privateRouter);

    // Error handler
    app.use(errorHandler);

    // Start the
    const { port } = config.server;

    appServer = app.listen(port);

    ctx.log.info(`Server listening on port ${port}`);

    return app;
  }
);

export const quit = async () => {
  appServer?.close();
};
