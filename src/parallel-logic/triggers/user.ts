import { wrapper } from "@/components";
import { User } from "@/graph/objects/types";
import { QueueEvent } from "@/queue";
import { Context } from "@/tracing";
import { rule1 } from "@/parallel-logic/rules/rule1";
import { rule2 } from "@/parallel-logic/rules/rule2";
import { rule6 } from "../rules/rule6";

export const onPost = wrapper(
  { name: "onPost", file: __filename },
  async (ctx: Context, event: QueueEvent<User>) => {
    await rule1(ctx, event);
    await rule2(ctx, event);
  }
);

export const onPatch = wrapper(
  { name: "onPatch", file: __filename },
  async (ctx: Context, event: QueueEvent<User>) => {
    // If email or phone changed, trigger rule 1
    if (
      event.current?.email !== event.previous?.email ||
      event.current?.phone !== event.previous?.phone
    ) {
      await rule1(ctx, event);
    }

    // If status changed, trigger rule 2
    if (event.current?.status !== event.previous?.status) {
      await rule2(ctx, event);
    }

    // If email or phone verified, trigger rule 6
    if (
      (event.current?.email_verified && !event.previous?.email_verified) ||
      (event.current?.phone_verified && !event.previous?.phone_verified)
    ) {
      await rule6(ctx, event);
    }
  }
);
