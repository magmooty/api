import * as api from "@/api";
import { errors, persistence, queue, sync, valueSets, wrapper } from "@/components";
import { Context } from "@/tracing";

const bootstrap = wrapper(
  { name: "bootstrap", file: __filename },
  async (ctx: Context) => {
    await persistence.init();
    await errors.init();
    await valueSets.init();
    await queue.init(ctx);
    await sync.init(ctx);
    await api.init(ctx);
  }
);

bootstrap();
