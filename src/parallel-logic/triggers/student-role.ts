import { wrapper } from "@/components";
import { StudentRole } from "@/graph/objects/types";
import { rule11 } from "@/parallel-logic/rules/rule11";
import { rule12 } from "@/parallel-logic/rules/rule12";
import { QueueEvent } from "@/queue";
import { Context } from "@/tracing";

export const onPost = wrapper(
  { name: "onPost", file: __filename },
  async (ctx: Context, event: QueueEvent<StudentRole>) => {
    await rule11(ctx, event);
  }
);

export const onDelete = wrapper(
  { name: "onDelete", file: __filename },
  async (ctx: Context, event: QueueEvent<StudentRole>) => {
    await rule12(ctx, event);
  }
);
