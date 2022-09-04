import { wrapper } from "@/components";
import { QueueEvent } from "@/queue";
import { Context } from "@/tracing";
import { User } from "@/graph/objects/types";
import { SyncOperation, SyncOperationMethod } from "@/sync/types";
import { IndexName } from "@/sync/mapping";
import { universalDeleteGenerator } from "../commons/universal-delete-generator";

const INDEX_NAME: IndexName = "user";

const universalUserGenerator = (
  method: SyncOperationMethod,
  object: User
): SyncOperation[] => {
  const { name, email, phone } = object;

  let searchableName = "";

  if (name) {
    searchableName = name
      .map((humanName) =>
        [
          humanName.first_name || "",
          humanName.middle_name || "",
          humanName.last_name || "",
        ]
          .map((str) => str.trim())
          .join(" ")
      )
      .join(" ");
  }

  return [
    {
      method,
      index: INDEX_NAME,
      id: object.id,
      data: {
        name: searchableName,
        email,
        email_text: email,
        phone,
        phone_text: phone,
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

export const onDelete = wrapper(
  { name: "onDelete", file: __filename },
  async (
    ctx: Context,
    event: QueueEvent<User>
  ): Promise<SyncOperation<User>[]> => {
    ctx.register(event);

    if (!event.previous) {
      return [];
    }

    return universalDeleteGenerator(INDEX_NAME, event.previous);
  }
);
