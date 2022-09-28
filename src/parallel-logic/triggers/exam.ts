import { wrapper } from "@/components";
import { Exam } from "@/graph/objects/types";
import { rule22 } from "@/parallel-logic/rules/rule22";
import { QueueEvent } from "@/queue";
import { Context } from "@/tracing";

export const onPost = wrapper(
  { name: "onPost", file: __filename },
  async (ctx: Context, event: QueueEvent<Exam>) => {
    await rule22(ctx, event);
  }
);
