import {
  auth,
  config,
  errors,
  metrics,
  persistence,
  queue,
  search,
  sync,
  wrapper,
} from "@/components";
import { Context } from "@/tracing";
import express from "express";

const startServer = wrapper(
  { name: "startServer", file: __filename },
  async (ctx: Context) => {
    // Initialize components
    await persistence.init();
    await errors.init();
    await queue.init();
    await sync.init();

    //TODO: object field 'required' checks will be done in the API

    await persistence.updateObject(
      null,
      "005763e0-6d38-448e-9683-3eefc633f93e-Z1",
      { name: "Ziad Alzarka 2" }
    );

    // const r = await auth.register(null, "ziadalzarka@gmail.com", "loVeA6irl", {
    //   roles: ["user"],
    // });

    const app = express();

    metrics.installApp(app);

    const { port } = config.server;

    app.listen(port);

    ctx.log.info(`Server listening on port ${port}`);
  }
);

startServer();
