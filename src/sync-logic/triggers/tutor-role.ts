import { wrapper } from "@/components";
import { TutorRole } from "@/graph/objects/types";
import { BaseQueueEvent } from "@/queue";
import { rule32 } from "@/sync-logic/rules/rule32";
import { Context } from "@/tracing";

export const onPost = wrapper(
  { name: "onPost", file: __filename },
  async (ctx: Context, event: BaseQueueEvent<TutorRole>) => {
    await rule32(ctx, event);
  }
);
