import { queue, wrapper } from "@/components";
import { GraphObject, IEdge } from "@/graph/objects/types";
import { QueueEvent } from "@/queue";
import { Context } from "@/tracing";
import parallelLogicTriggers from "./triggers";

export class ParallelLogic {
  init = wrapper({ name: "init", file: __filename }, (ctx: Context) => {
    queue.subscribe(ctx, "parallel-logic", this.processEvent);
  });

  processEvent = wrapper(
    { name: "processEvent", file: __filename },
    async (ctx: Context, event: QueueEvent<GraphObject | IEdge>) => {
      ctx.register({ event });

      const handler: keyof typeof parallelLogicTriggers =
        `${event.method} ${event.path}` as any;

      if (parallelLogicTriggers[handler]) {
        await parallelLogicTriggers[handler](ctx, event);
      }
    }
  );
}
