import { persistence, wrapper } from "@/components";
import { AcademicYear, AcademicYearStats } from "@/graph/objects/types";
import { QueueEvent } from "@/queue";
import { Context } from "@/tracing";

export const rule8 = wrapper(
  { name: "rule8", file: __filename },
  async (ctx: Context, event: QueueEvent<AcademicYear>) => {
    if (!event.current) {
      return;
    }

    const statsObject = await persistence.createObject<AcademicYearStats>(
      ctx,
      {
        object_type: "academic_year_stats",
        academic_year: event.current.id,
        student_counter: 0,
      },
      { author: event.author }
    );

    await persistence.updateObject<AcademicYear>(
      ctx,
      event.current.id,
      { stats: statsObject.id },
      { author: event.author }
    );
  }
);
