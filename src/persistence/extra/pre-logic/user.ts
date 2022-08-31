import { wrapper } from "@/components";
import { GraphObject } from "@/graph/objects/types";
import { Context } from "@/tracing";

export const onPatch = wrapper(
  { name: "onPatch", file: __filename },
  async (ctx: Context, previous: GraphObject, updatePayload) => {
    ctx.register({ previous, updatePayload });

    if (updatePayload.email && previous.email !== updatePayload.email) {
      updatePayload.email_verified = false;
    }
  }
);
