import { persistence, search, wrapper } from "@/components";
import { BillableItem, BillableItemLog } from "@/graph/objects/types";
import { billableItemMaxDate } from "@/graph/util/billable-item";
import { QueueEvent } from "@/queue";
import { Context } from "@/tracing";

export const rule19 = wrapper(
  { name: "rule19", file: __filename },
  async (ctx: Context, event: QueueEvent<BillableItem>) => {
    if (!event.current) {
      return;
    }

    const maxDate = billableItemMaxDate(event.current.time_table);

    if (maxDate && new Date(maxDate) < new Date()) {
      return;
    }

    await search.allByBatch<string>(
      ctx,
      "student_role",
      {
        filters: {
          and: [
            {
              academic_year: event.current.academic_year,
            },
          ],
        },
      },
      async (student) => {
        if (!event.current) {
          return;
        }

        await persistence.createObject<BillableItemLog>(ctx, {
          object_type: "billable_item_log",
          student,
          billable_item: event.current.id,
        });
      },
      { lean: true }
    );
  }
);
