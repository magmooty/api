import {
  config,
  errors,
  metrics,
  persistence,
  queue,
  sync,
  wrapper,
} from "@/components";
import { User } from "@/graph/objects/types";
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

    console.log("init done");

    //TODO: object field 'required' checks will be done in the API

    const object = await persistence.createObject<User>(null, {
      object_type: "user",
      name: "Ziad Alzarka",
      email: "ziad@flowhealth.com",
      hash: "test",
    });

    const isUnique1 = await persistence.checkUnique(
      null,
      "user",
      "email",
      "ziad2@flowhealth.com"
    );

    console.log({ object, isUnique1 });

    // const updated = await persistence.updateObject<User>(
    //   null,
    //   "0414eb66-e9e7-4ad0-bb04-ea4f6de75cdf-Z1",
    //   {
    //     email: "ziad2@flowhealth.com",
    //   }
    // );

    // const isUnique2 = await persistence.checkUnique(
    //   null,
    //   "user",
    //   "email",
    //   "ziad2@flowhealth.com"
    // );

    // console.log({ updated, isUnique2 });

    const app = express();

    metrics.installApp(app);

    const { port } = config.server;

    app.listen(port);

    ctx.log.info(`Server listening on port ${port}`);
  }
);

startServer();
