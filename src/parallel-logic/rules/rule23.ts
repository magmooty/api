import { persistence, wrapper } from "@/components";
import {
  BillableItem,
  BillableItemLog,
  BillableItemStats,
} from "@/graph/objects/types";
import { QueueEvent } from "@/queue";
import { Context } from "@/tracing";

export const rule23 = wrapper(
  { name: "rule23", file: __filename },
  async (ctx: Context, event: QueueEvent<BillableItemLog>) => {
    if (!event.current) {
      return;
    }

    const { stats } = await persistence.getObject<BillableItem>(
      ctx,
      event.current.billable_item
    );

    await persistence.updateObject<BillableItemStats>(
      ctx,
      stats,
      { student_counter: "+1" },
      { author: event.author }
    );
  }
);
