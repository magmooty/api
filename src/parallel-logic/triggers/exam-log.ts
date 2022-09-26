import { wrapper } from "@/components";
import { ExamLog } from "@/graph/objects/types";
import { rule24 } from "@/parallel-logic/rules/rule24";
import { rule25 } from "@/parallel-logic/rules/rule25";
import { QueueEvent } from "@/queue";
import { Context } from "@/tracing";

export const onPost = wrapper(
  { name: "onPost", file: __filename },
  async (ctx: Context, event: QueueEvent<ExamLog>) => {
    await rule24(ctx, event);
  }
);

export const onDelete = wrapper(
  { name: "onDelete", file: __filename },
  async (ctx: Context, event: QueueEvent<ExamLog>) => {
    await rule25(ctx, event);
  }
);
