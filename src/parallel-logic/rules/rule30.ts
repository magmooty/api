import { persistence, wrapper } from "@/components";
import { AssistantRole } from "@/graph/objects/types";
import { QueueEvent } from "@/queue";
import { Context } from "@/tracing";

export const rule30 = wrapper(
  { name: "rule30", file: __filename },
  async (ctx: Context, event: QueueEvent<AssistantRole>) => {
    if (!event.current) {
      return;
    }

    await persistence.createEdge(
      ctx,
      event.current.space,
      "assistants",
      event.current.id,
      { author: event.author }
    );
  }
);
