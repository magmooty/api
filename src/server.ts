import { config, errors, metrics, persistence, wrapper } from "@/components";
import { User } from "@/graph/objects/types";
import { Context } from "@/tracing";
import express from "express";

const startServer = wrapper(
  { name: "startServer", file: __filename },
  async (ctx: Context) => {
    // Initialize components
    await persistence.init();
    await errors.init();

    //TODO: object field 'required' checks will be done in the API

    const app = express();

    metrics.installApp(app);

    const { port } = config.server;

    app.listen(port);

    ctx.log.info(`Server listening on port ${port}`);
  }
);

startServer();
