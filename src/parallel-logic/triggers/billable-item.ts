import { wrapper } from "@/components";
import { BillableItem } from "@/graph/objects/types";
import { rule19 } from "@/parallel-logic/rules/rule19";
import { QueueEvent } from "@/queue";
import { Context } from "@/tracing";

export const onPost = wrapper(
  { name: "onPost", file: __filename },
  async (ctx: Context, event: QueueEvent<BillableItem>) => {
    await rule19(ctx, event);
  }
);
