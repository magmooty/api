import { persistence, wrapper } from "@/components";
import { User, UserStatus } from "@/graph/objects/types";
import { serializeDate } from "@/persistence/commons/serialize-date";
import { QueueEvent } from "@/queue";
import { Context } from "@/tracing";

export const rule2 = wrapper(
  { name: "rule2", file: __filename },
  async (ctx: Context, event: QueueEvent<User>) => {
    // Tihs will work for both POST and PATCH
    if (event.current && event.current?.status !== event.previous?.status) {
      const userStatus = await persistence.createObject<UserStatus>(ctx, {
        set_by: event.current.id,
        set_at: serializeDate(),
        status: "created",
        user: event.current.id,
        object_type: "user-status",
      });

      await persistence.createEdge(
        ctx,
        event.current.id,
        "statuses",
        userStatus.id
      );
    }
  }
);
