import { wrapper } from "@/components";
import { User } from "@/graph/objects/types";
import { QueueEvent } from "@/queue";
import { Context } from "@/tracing";
import { rule1 } from "@/parallel-logic/rules/rule1";

export const onPost = wrapper(
  { name: "onPost", file: __filename },
  async (ctx: Context, event: QueueEvent<User>) => {
    await rule1(ctx, event);
  }
);

export const onPatch = wrapper(
  { name: "onPatch", file: __filename },
  async (ctx: Context, event: QueueEvent<User>) => {
    // If email changed, trigger rule 1
    if (event.current?.email !== event.previous?.email) {
      await rule1(ctx, event);
    }

    // If phone changed, trigger rule 1
    if (event.current?.phone !== event.previous?.phone) {
      await rule1(ctx, event);
    }
  }
);
