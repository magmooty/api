import { wrapper } from "@/components";
import { StudyGroup } from "@/graph/objects/types";
import { BaseQueueEvent } from "@/queue";
import { rule9 } from "@/sync-logic/rules/rule9";
import { Context } from "@/tracing";

export const onPost = wrapper(
  { name: "onPost", file: __filename },
  async (ctx: Context, event: BaseQueueEvent<StudyGroup>) => {
    await rule9(ctx, event);
  }
);
