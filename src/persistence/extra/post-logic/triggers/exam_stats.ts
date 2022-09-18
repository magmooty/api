import { wrapper } from "@/components";
import { ExamStats } from "@/graph/objects/types";
import { Context } from "@/tracing";
import { rule15 } from "@/persistence/extra/post-logic/rules/rule15";
import { rule16 } from "@/persistence/extra/post-logic/rules/rule16";
import { PostLogicPayload } from "..";

export const onGet = wrapper(
  { name: "onGet", file: __filename },
  async (ctx: Context, object: ExamStats, payload: PostLogicPayload) => {
    await rule16(ctx, object);
  }
);

export const onPost = wrapper(
  { name: "onPost", file: __filename },
  async (ctx: Context, object: ExamStats, payload: PostLogicPayload) => {
    await rule15(ctx, object, payload);
  }
);

export const onPatch = wrapper(
  { name: "onPatch", file: __filename },
  async (ctx: Context, object: ExamStats, payload: PostLogicPayload) => {
    await rule15(ctx, object, payload);
  }
);
