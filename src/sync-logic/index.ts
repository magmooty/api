import { wrapper } from "@/components";
import { GraphObject, IEdge } from "@/graph/objects/types";
import { BaseQueueEvent } from "@/queue";
import { Context } from "@/tracing";
import syncLogicTriggers from "./triggers";

export class SyncLogic {
  processEvent = wrapper(
    { name: "processEvent", file: __filename },
    async (ctx: Context, event: BaseQueueEvent<GraphObject | IEdge>) => {
      ctx.register({ event });

      const handler: keyof typeof syncLogicTriggers =
        `${event.method} ${event.path}` as any;

      if (syncLogicTriggers[handler]) {
        await syncLogicTriggers[handler](ctx, event as any);
      }
    }
  );
}
