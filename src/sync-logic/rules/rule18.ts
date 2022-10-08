import { persistence, wrapper } from "@/components";
import {
  AcademicYear,
  AcademicYearStats,
  BillableItem,
  BillableItemStats,
} from "@/graph/objects/types";
import { BaseQueueEvent } from "@/queue";
import { Context } from "@/tracing";

export const rule18 = wrapper(
  { name: "rule18", file: __filename },
  async (ctx: Context, event: BaseQueueEvent<BillableItem>) => {
    if (!event.current) {
      return;
    }

    const statsObject = await persistence.createObject<BillableItemStats>(
      ctx,
      {
        object_type: "billable_item_stats",
        billable_item: event.current.id,
        student_counter: 0,
      },
      { author: event.author }
    );

    await persistence.updateObject<BillableItem>(
      ctx,
      event.current.id,
      { stats: statsObject.id },
      { author: event.author }
    );
  }
);
