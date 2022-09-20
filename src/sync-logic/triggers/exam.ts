import { wrapper } from "@/components";
import { Exam } from "@/graph/objects/types";
import { BaseQueueEvent } from "@/queue";
import { rule10 } from "@/sync-logic/rules/rule10";
import { Context } from "@/tracing";

export const onPost = wrapper(
  { name: "onPost", file: __filename },
  async (ctx: Context, event: BaseQueueEvent<Exam>) => {
    await rule10(ctx, event);
  }
);
