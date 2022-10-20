import { wrapper } from "@/components";
import {
  ObjectViewVirtualExecutor,
  ObjectViewVirtualExecutorOptions,
} from "@/graph";
import { AssistantSpaceInvite, GraphObject } from "@/graph/objects/types";
import { Context } from "@/tracing";

export const AssistantSpaceInviteHasInviteExecutor: ObjectViewVirtualExecutor =
  wrapper(
    { name: "AssistantSpaceInviteHasInviteExecutor", file: __filename },
    async (
      ctx: Context,
      object: GraphObject,
      { author }: ObjectViewVirtualExecutorOptions
    ): Promise<boolean> => {
      const { invited_id } = object as AssistantSpaceInvite;

      if (author.email === invited_id || author.phone === invited_id) {
        return true;
      }

      return false;
    }
  );
