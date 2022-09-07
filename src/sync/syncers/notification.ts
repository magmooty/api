import { wrapper } from "@/components";
import { QueueEvent } from "@/queue";
import { Context } from "@/tracing";
import { Notification, NotificationIndexMapping } from "@/graph/objects/types";
import { SyncOperation, SyncOperationMethod } from "@/sync/types";
import { IndexName } from "@/sync/mapping";
import { universalDeleteGenerator } from "../commons/universal-delete-generator";

const INDEX_NAME: IndexName = "notification";

const universalNotificationGenerator = (
  method: SyncOperationMethod,
  object: Notification
): SyncOperation[] => {
  const { user, role, type } = object;

  return [
    {
      method,
      index: INDEX_NAME,
      id: object.id,
      data: {
        type,
        user,
        role: role || "no-role",
      },
    },
  ];
};

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

    return universalNotificationGenerator("create", event.current);
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

    return universalNotificationGenerator("update", event.current);
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
