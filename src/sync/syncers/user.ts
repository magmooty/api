import { wrapper } from "@/components";
import { QueueEvent } from "@/queue";
import { Context } from "@/tracing";
import { User, UserIndexMapping } from "@/graph/objects/types";
import { SyncOperation, SyncOperationMethod } from "@/sync/types";
import { IndexName } from "@/sync/mapping";
import { universalDeleteGenerator } from "../commons/universal-delete-generator";
import { extractSearchableNameFromHumanNameArray } from "../common";

const INDEX_NAME: IndexName = "user";

const universalGenerator = wrapper(
  { name: "universalGenerator", file: __filename },
  async (
    ctx: Context,
    method: SyncOperationMethod,
    object: User
  ): Promise<SyncOperation<UserIndexMapping>[]> => {
    const { name, email, phone, updated_at } = object;

    const searchableName = extractSearchableNameFromHumanNameArray(name);

    return [
      {
        method,
        index: INDEX_NAME,
        id: object.id,
        data: {
          ...(searchableName && { name: searchableName }),
          email,
          email_text: email,
          phone,
          phone_text: phone,
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
    event: QueueEvent<User>
  ): Promise<SyncOperation<UserIndexMapping>[]> => {
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
    event: QueueEvent<User>
  ): Promise<SyncOperation<UserIndexMapping>[]> => {
    ctx.register(event);

    if (!event.current) {
      return [];
    }

    return universalGenerator(ctx, "create", event.current);
  }
);

export const onDelete = wrapper(
  { name: "onDelete", file: __filename },
  async (
    ctx: Context,
    event: QueueEvent<User>
  ): Promise<SyncOperation<UserIndexMapping>[]> => {
    ctx.register(event);

    if (!event.previous) {
      return [];
    }

    return universalDeleteGenerator(INDEX_NAME, event.previous);
  }
);
