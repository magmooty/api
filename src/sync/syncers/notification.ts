import { wrapper } from "@/components";
import { QueueEvent } from "@/queue";
import { Context } from "@/tracing";
import { Notification, NotificationIndexMapping } from "@/graph/objects/types";
import { SyncOperation, SyncOperationMethod } from "@/sync/types";
import { IndexName } from "@/sync/mapping";
import { universalDeleteGenerator } from "../commons/universal-delete-generator";

const INDEX_NAME: IndexName = "notification";

const universalGenerator = wrapper(
  { name: "universalGenerator", file: __filename },
  async (
    ctx: Context,
    method: SyncOperationMethod,
    object: Notification
  ): Promise<SyncOperation[]> => {
    const { user, role, type, updated_at } = object;

    return [
      {
        method,
        index: INDEX_NAME,
        id: object.id,
        data: {
          type,
          user,
          role: role || "no-role",
          updated_at,
        },
      },
    ];
  }
);

export const onPost = wrapper(
  { name: "onPost", file: __filename },
  async (
    ctx: Context,
    event: QueueEvent<Notification>
  ): Promise<SyncOperation<NotificationIndexMapping>[]> => {
    ctx.register(event);

    if (!event.current) {
      return [];
    }

    return universalGenerator(ctx, "create", event.current);
  }
);

export const onPatch = wrapper(
  { name: "onPatch", file: __filename },
  async (
    ctx: Context,
    event: QueueEvent<Notification>
  ): Promise<SyncOperation<NotificationIndexMapping>[]> => {
    ctx.register(event);

    if (!event.current) {
      return [];
    }

    return universalGenerator(ctx, "update", event.current);
  }
);

export const onDelete = wrapper(
  { name: "onDelete", file: __filename },
  async (
    ctx: Context,
    event: QueueEvent<Notification>
  ): Promise<SyncOperation<NotificationIndexMapping>[]> => {
    ctx.register(event);

    if (!event.previous) {
      return [];
    }

    return universalDeleteGenerator(INDEX_NAME, event.previous);
  }
);
