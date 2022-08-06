import express from "express";
import { config, errors, metrics, persistence, wrapper } from "@/components";
import { Context } from "@/tracing";
import { User } from "@/graph/objects/types";

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
