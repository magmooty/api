import { queue, wrapper } from "@/components";
import { GraphObject } from "@/graph/objects/types";
import { QueueEvent } from "@/queue";
import { Context } from "@/tracing";

export class ParallelLogic {
  init = wrapper({ name: "init", file: __filename }, (ctx: Context) => {
    queue.subscribe(ctx, "parallel-logic", this.processEvent);
  });

  processEvent = wrapper(
    { name: "processEvent", file: __filename },
    (ctx: Context, event: QueueEvent<GraphObject>) => {
      ctx.register({ event });
    }
  );
}
