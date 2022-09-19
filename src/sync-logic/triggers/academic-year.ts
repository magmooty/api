import { wrapper } from "@/components";
import { AcademicYear } from "@/graph/objects/types";
import { QueueEvent } from "@/queue";
import { Context } from "@/tracing";
import { rule8 } from "@/sync-logic/rules/rule8";

export const onPost = wrapper(
  { name: "onPost", file: __filename },
  async (ctx: Context, event: QueueEvent<AcademicYear>) => {
    await rule8(ctx, event);
  }
);
