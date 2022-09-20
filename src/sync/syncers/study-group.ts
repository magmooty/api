import { persistence, wrapper } from "@/components";
import {
  AcademicYear,
  StudyGroup,
  StudyGroupIndexMapping,
} from "@/graph/objects/types";
import { QueueEvent } from "@/queue";
import { IndexName } from "@/sync/mapping";
import { SyncOperation, SyncOperationMethod } from "@/sync/types";
import { Context } from "@/tracing";
import { universalDeleteGenerator } from "../commons/universal-delete-generator";

const INDEX_NAME: IndexName = "study_group";

const universalGenerator = wrapper(
  { name: "universalGenerator", file: __filename },
  async (
    ctx: Context,
    method: SyncOperationMethod,
    object: StudyGroup
  ): Promise<SyncOperation[]> => {
    const { name, academic_year, updated_at } = object;

    const { space } = await persistence.getObject<AcademicYear>(
      ctx,
      academic_year
    );

    return [
      {
        method,
        index: INDEX_NAME,
        id: object.id,
        data: {
          name,
          space,
          academic_year,
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
    event: QueueEvent<StudyGroup>
  ): Promise<SyncOperation<StudyGroupIndexMapping>[]> => {
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
    event: QueueEvent<StudyGroup>
  ): Promise<SyncOperation<StudyGroupIndexMapping>[]> => {
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
    event: QueueEvent<StudyGroup>
  ): Promise<SyncOperation<StudyGroupIndexMapping>[]> => {
    ctx.register(event);

    if (!event.previous) {
      return [];
    }

    return universalDeleteGenerator(INDEX_NAME, event.previous);
  }
);
