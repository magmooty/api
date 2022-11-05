import { wrapper } from "@/components";
import { AssistantRole } from "@/graph/objects/types";
import { rule30 } from "@/parallel-logic/rules/rule30";
import { QueueEvent } from "@/queue";
import { Context } from "@/tracing";

export const onPost = wrapper(
  { name: "onPost", file: __filename },
  async (ctx: Context, event: QueueEvent<AssistantRole>) => {
    await rule30(ctx, event);
  }
);
