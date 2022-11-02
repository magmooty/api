import { wrapper } from "@/components";
import { AssistantRole } from "@/graph/objects/types";
import { BaseQueueEvent } from "@/queue";
import { rule32 } from "@/sync-logic/rules/rule32";
import { Context } from "@/tracing";
import _ from "lodash";

export const onPost = wrapper(
  { name: "onPost", file: __filename },
  async (ctx: Context, event: BaseQueueEvent<AssistantRole>) => {
    await rule32(ctx, event);
  }
);

export const onPatch = wrapper(
  { name: "onPatch", file: __filename },
  async (ctx: Context, event: BaseQueueEvent<AssistantRole>) => {
    if (!_.isEqual(event.current?.permissions, event.previous?.permissions)) {
      await rule32(ctx, event);
    }
  }
);
