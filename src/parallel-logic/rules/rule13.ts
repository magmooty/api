import { persistence, wrapper } from "@/components";
import {
  AcademicYear,
  AcademicYearStats,
  StudentRole,
} from "@/graph/objects/types";
import { QueueEvent } from "@/queue";
import { Context } from "@/tracing";

export const rule13 = wrapper(
  { name: "rule13", file: __filename },
  async (ctx: Context, event: QueueEvent<StudentRole>) => {
    if (!event.current || !event.previous) {
      return;
    }

    const { academic_year: oldAcademicYearId } = event.previous;

    const oldAcademicYear = await persistence.getObject<AcademicYear>(
      ctx,
      oldAcademicYearId
    );

    await persistence.updateObject<AcademicYearStats>(
      ctx,
      oldAcademicYear.stats,
      {
        student_counter: "-1",
      },
      { author: event.author }
    );

    const { academic_year: newAcademicYearId } = event.current;

    const newAcademicYear = await persistence.getObject<AcademicYear>(
      ctx,
      newAcademicYearId
    );

    await persistence.updateObject<AcademicYearStats>(
      ctx,
      newAcademicYear.stats,
      {
        student_counter: "+1",
      },
      { author: event.author }
    );
  }
);
