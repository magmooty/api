import { wrapper } from "@/components";
import { TutorRole } from "@/graph/objects/types";
import { rule3 } from "@/parallel-logic/rules/rule3";
import { QueueEvent } from "@/queue";
import { Context } from "@/tracing";
import { rule7 } from "@/parallel-logic/rules/rule7";

export const onPost = wrapper(
  { name: "onPost", file: __filename },
  async (ctx: Context, event: QueueEvent<TutorRole>) => {
    await rule3(ctx, event);
    await rule7(ctx, event);
  }
);
