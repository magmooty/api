import { wrapper } from "@/components";
import { BillableItemLog } from "@/graph/objects/types";
import { rule23 } from "@/parallel-logic/rules/rule23";
import { rule26 } from "@/parallel-logic/rules/rule26";
import { QueueEvent } from "@/queue";
import { Context } from "@/tracing";

export const onPost = wrapper(
  { name: "onPost", file: __filename },
  async (ctx: Context, event: QueueEvent<BillableItemLog>) => {
    await rule23(ctx, event);
  }
);

export const onDelete = wrapper(
  { name: "onDelete", file: __filename },
  async (ctx: Context, event: QueueEvent<BillableItemLog>) => {
    await rule26(ctx, event);
  }
);
