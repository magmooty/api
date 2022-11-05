import { wrapper } from "@/components";
import { Space } from "@/graph/objects/types";
import { BaseQueueEvent } from "@/queue";
import { rule29 } from "@/sync-logic/rules/rule29";
import { Context } from "@/tracing";

export const onPost = wrapper(
  { name: "onPost", file: __filename },
  async (ctx: Context, event: BaseQueueEvent<Space>) => {
    await rule29(ctx, event);
  }
);
