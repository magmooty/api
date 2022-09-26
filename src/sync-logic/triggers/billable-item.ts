import { wrapper } from "@/components";
import { BillableItem } from "@/graph/objects/types";
import { BaseQueueEvent } from "@/queue";
import { rule18 } from "@/sync-logic/rules/rule18";
import { Context } from "@/tracing";

export const onPost = wrapper(
  { name: "onPost", file: __filename },
  async (ctx: Context, event: BaseQueueEvent<BillableItem>) => {
    await rule18(ctx, event);
  }
);
