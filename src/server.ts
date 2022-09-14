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
} from "@/components";
import { Context } from "@/tracing";
import { Space } from "./graph/objects/types";

const bootstrap = wrapper(
  { name: "bootstrap", file: __filename },
  async (ctx: Context) => {
    await errors.init(ctx);
    await valueSets.init(ctx);
    await queue.init(ctx);
    await persistence.init(ctx);
    await search.init(ctx);
    await api.init(ctx);
    await parallelLogic.init(ctx);
    await sync.init(ctx);
  }
);

bootstrap();
