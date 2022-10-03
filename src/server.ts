import * as api from "@/api";
import {
  errors,
  parallelLogic,
  persistence,
  queue,
  search,
  sync,
  valueSets,
  wrapper,
  isTesting,
} from "@/components";
import { Context } from "@/tracing";

export const bootstrapServer = wrapper(
  { name: "bootstrapServer", file: __filename },
  async (ctx: Context) => {
    let app;

    await errors.init(ctx);
    await valueSets.init(ctx);
    await queue.init(ctx);
    await persistence.init(ctx);
    await search.init(ctx);

    if (!isTesting) {
      app = await api.init(ctx);
    }

    await parallelLogic.init(ctx);
    await sync.init(ctx);

    // Initialize for testing only after all components all initialized
    if (isTesting) {
      app = await api.init(ctx);
    }

    return app;
  }
);
