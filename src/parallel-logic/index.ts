import { queue, wrapper } from "@/components";
import { GraphObject, IEdge } from "@/graph/objects/types";
import { QueueEvent } from "@/queue";
import { Context } from "@/tracing";
import parallelLogicTriggers from "./triggers";

export interface ParallelLogicConfig {
  deepDeletionSingleObjectConcurrency: number;
}

export class ParallelLogic {
  init = wrapper({ name: "init", file: __filename }, async (ctx: Context) => {
    await queue.subscribe(ctx, "parallel-logic", this.processEvent);
  });

  processEvent = wrapper(
    { name: "processEvent", file: __filename },
    async (ctx: Context, event: QueueEvent<GraphObject | IEdge>) => {
      ctx.register({ event });

      const handler: keyof typeof parallelLogicTriggers =
        `${event.method} ${event.path}` as any;

      if (parallelLogicTriggers[handler]) {
        await parallelLogicTriggers[handler](ctx, event as any);
      }

      const allHandler: keyof typeof parallelLogicTriggers =
        `${event.method} all` as any;

      if (parallelLogicTriggers[allHandler]) {
        await parallelLogicTriggers[allHandler](ctx, event as any);
      }
    }
  );
}
