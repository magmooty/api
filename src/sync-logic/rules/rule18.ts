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

    const academicYear = await persistence.getObject<AcademicYear>(
      ctx,
      event.current.academic_year
    );

    let studentsCountInAcademicYear = 0;

    try {
      if (academicYear.stats) {
        const academicYearStats =
          await persistence.getObject<AcademicYearStats>(
            ctx,
            academicYear.stats
          );

        studentsCountInAcademicYear = academicYearStats.student_counter;
      }
    } catch {}

    const statsObject = await persistence.createObject<BillableItemStats>(
      ctx,
      {
        object_type: "billable_item_stats",
        student_counter: studentsCountInAcademicYear,
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
