import { wrapper } from "@/components";
import { QueueEvent } from "@/queue";
import { Context } from "@/tracing";
import { User } from "@/graph/objects/types";
import { SyncOperation, SyncOperationMethod } from "@/sync/types";
import { IndexName } from "@/sync/mapping";

const INDEX_NAME: IndexName = "user";

const universalUserGenerator = (
  method: SyncOperationMethod,
  object: User
): SyncOperation[] => {
  const { name, email } = object;

  return [
    {
      method,
      index: INDEX_NAME,
      id: object.id,
      data: {
        name,
        email,
        email_text: email,
      },
    },
  ];
};

export const onPost = wrapper(
  { name: "onPost", file: __filename },
  async (
    ctx: Context,
    event: QueueEvent<User>
  ): Promise<SyncOperation<User>[]> => {
    ctx.register(event);

    if (!event.current) {
      return [];
    }

    return universalUserGenerator("create", event.current);
  }
);

export const onPatch = wrapper(
  { name: "onPatch", file: __filename },
  async (
    ctx: Context,
    event: QueueEvent<User>
  ): Promise<SyncOperation<User>[]> => {
    ctx.register(event);

    if (!event.current) {
      return [];
    }

    return universalUserGenerator("update", event.current);
  }
);
