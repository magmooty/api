import { persistence, wrapper } from "@/components";
import { TutorRole } from "@/graph/objects/types";
import { QueueEvent } from "@/queue";
import { Context } from "@/tracing";

export const rule7 = wrapper(
  { name: "rule7", file: __filename },
  async (ctx: Context, event: QueueEvent<TutorRole>) => {
    if (event.current && event.current?.user) {
      await persistence.createEdge(
        ctx,
        event.current.user,
        "roles",
        event.current.id
      );
    }
  }
);
