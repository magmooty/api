import { wrapper } from "@/components";
import { StudentRole, StudentRoleIndexMapping } from "@/graph/objects/types";
import { QueueEvent } from "@/queue";
import { IndexName } from "@/sync/mapping";
import { SyncOperation, SyncOperationMethod } from "@/sync/types";
import { Context } from "@/tracing";
import { extractSearchableNameFromHumanNameArray } from "../common";
import { universalDeleteGenerator } from "../commons/universal-delete-generator";

const INDEX_NAME: IndexName = "student_role";

const universalGenerator = wrapper(
  { name: "universalGenerator", file: __filename },
  async (
    ctx: Context,
    method: SyncOperationMethod,
    object: StudentRole
  ): Promise<SyncOperation[]> => {
    const { name, academic_year, study_group, updated_at } = object;

    let { contacts } = object;

    const searchableName = extractSearchableNameFromHumanNameArray(name);

    if (!contacts) {
      contacts = [];
    }

    const student_phones = contacts
      .filter(
        (contact) => contact.use === "personal" && contact.type === "phone"
      )
      .map((contact) => contact.value);

    const parent_phones = contacts
      .filter((contact) => contact.use === "parent" && contact.type === "phone")
      .map((contact) => contact.value);

    const phone_text = [...student_phones, ...parent_phones].join(" ");

    return [
      {
        method,
        index: INDEX_NAME,
        id: object.id,
        data: {
          name: searchableName,
          academic_year,
          study_group,
          student_phones,
          parent_phones,
          phone_text,
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
    event: QueueEvent<StudentRole>
  ): Promise<SyncOperation<StudentRoleIndexMapping>[]> => {
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
    event: QueueEvent<StudentRole>
  ): Promise<SyncOperation<StudentRoleIndexMapping>[]> => {
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
    event: QueueEvent<StudentRole>
  ): Promise<SyncOperation<StudentRoleIndexMapping>[]> => {
    ctx.register(event);

    if (!event.previous) {
      return [];
    }

    return universalDeleteGenerator(INDEX_NAME, event.previous);
  }
);
