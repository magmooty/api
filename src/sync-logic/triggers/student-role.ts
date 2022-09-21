import { wrapper } from "@/components";
import { StudentRole } from "@/graph/objects/types";
import { BaseQueueEvent } from "@/queue";
import { Context } from "@/tracing";
import { rule11 } from "@/sync-logic/rules/rule11";

export const onPost = wrapper(
  { name: "onPost", file: __filename },
  async (ctx: Context, event: BaseQueueEvent<StudentRole>) => {
    await rule11(ctx, event);
  }
);
