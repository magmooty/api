import { wrapper } from "@/components";
import {
  BillableItemLog,
  BillableItemLogIndexMapping,
} from "@/graph/objects/types";
import { QueueEvent } from "@/queue";
import { IndexName } from "@/sync/mapping";
import { SyncOperation, SyncOperationMethod } from "@/sync/types";
import { Context } from "@/tracing";
import { universalDeleteGenerator } from "../commons/universal-delete-generator";

const INDEX_NAME: IndexName = "billable_item_log";

const universalGenerator = wrapper(
  { name: "universalGenerator", file: __filename },
  async (
    ctx: Context,
    method: SyncOperationMethod,
    object: BillableItemLog
  ): Promise<SyncOperation[]> => {
    const { student, billable_item, amount, fully_paid_at, updated_at } =
      object;

    return [
      {
        method,
        index: INDEX_NAME,
        id: object.id,
        data: {
          student,
          billable_item,
          amount,
          fully_paid_at,
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
    event: QueueEvent<BillableItemLog>
  ): Promise<SyncOperation<BillableItemLogIndexMapping>[]> => {
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
    event: QueueEvent<BillableItemLog>
  ): Promise<SyncOperation<BillableItemLogIndexMapping>[]> => {
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
    event: QueueEvent<BillableItemLog>
  ): Promise<SyncOperation<BillableItemLogIndexMapping>[]> => {
    ctx.register(event);

    if (!event.previous) {
      return [];
    }

    return universalDeleteGenerator(INDEX_NAME, event.previous);
  }
);
