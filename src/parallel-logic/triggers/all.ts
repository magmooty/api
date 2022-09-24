import { wrapper } from "@/components";
import { GraphObject } from "@/graph/objects/types";
import { QueueEvent } from "@/queue";
import { Context } from "@/tracing";
import { rule21 } from "../rules/rule21";

export const onDelete = wrapper(
  { name: "onDelete", file: __filename },
  async (ctx: Context, event: QueueEvent<GraphObject>) => {
    await rule21(ctx, event);
  }
);
