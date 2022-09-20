import { wrapper } from "@/components";
import { QueueEvent } from "@/queue";
import { Context } from "@/tracing";
import { AcademicYear, AcademicYearIndexMapping } from "@/graph/objects/types";
import { SyncOperation, SyncOperationMethod } from "@/sync/types";
import { IndexName } from "@/sync/mapping";
import { universalDeleteGenerator } from "../commons/universal-delete-generator";

const INDEX_NAME: IndexName = "academic_year";

const universalGenerator = wrapper(
  { name: "universalGenerator", file: __filename },
  async (
    ctx: Context,
    method: SyncOperationMethod,
    object: AcademicYear
  ): Promise<SyncOperation[]> => {
    const { space, name, updated_at } = object;

    return [
      {
        method,
        index: INDEX_NAME,
        id: object.id,
        data: {
          name,
          space,
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
    event: QueueEvent<AcademicYear>
  ): Promise<SyncOperation<AcademicYearIndexMapping>[]> => {
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
    event: QueueEvent<AcademicYear>
  ): Promise<SyncOperation<AcademicYearIndexMapping>[]> => {
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
    event: QueueEvent<AcademicYear>
  ): Promise<SyncOperation<AcademicYearIndexMapping>[]> => {
    ctx.register(event);

    if (!event.previous) {
      return [];
    }

    return universalDeleteGenerator(INDEX_NAME, event.previous);
  }
);
