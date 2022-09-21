import { wrapper } from "@/components";
import { BillableItem, BillableItemIndexMapping } from "@/graph/objects/types";
import { QueueEvent } from "@/queue";
import { IndexName } from "@/sync/mapping";
import { SyncOperation, SyncOperationMethod } from "@/sync/types";
import { Context } from "@/tracing";
import { universalDeleteGenerator } from "../commons/universal-delete-generator";
import _ from "lodash";

const INDEX_NAME: IndexName = "billable_item";

const universalGenerator = wrapper(
  { name: "universalGenerator", file: __filename },
  async (
    ctx: Context,
    method: SyncOperationMethod,
    object: BillableItem
  ): Promise<SyncOperation[]> => {
    const { name, academic_year, type, price, time_table, updated_at } = object;

    let min_date = null;
    let max_date = null;

    if (time_table && time_table.length > 0) {
      min_date =
        _.minBy(time_table, (timeTableEntry) => timeTableEntry.date_from)
          ?.date_from || null;
      max_date =
        _.maxBy(time_table, (timeTableEntry) => timeTableEntry.date_to)
          ?.date_to || null;
    }

    const has_no_date = !min_date && !max_date;

    return [
      {
        method,
        index: INDEX_NAME,
        id: object.id,
        data: {
          name,
          academic_year,
          type,
          price,
          has_no_date,
          min_date,
          max_date,
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
    event: QueueEvent<BillableItem>
  ): Promise<SyncOperation<BillableItemIndexMapping>[]> => {
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
    event: QueueEvent<BillableItem>
  ): Promise<SyncOperation<BillableItemIndexMapping>[]> => {
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
    event: QueueEvent<BillableItem>
  ): Promise<SyncOperation<BillableItemIndexMapping>[]> => {
    ctx.register(event);

    if (!event.previous) {
      return [];
    }

    return universalDeleteGenerator(INDEX_NAME, event.previous);
  }
);
