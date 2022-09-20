import { persistence, wrapper } from "@/components";
import {
  AcademicYear,
  AcademicYearStats,
  Exam,
  ExamStats,
} from "@/graph/objects/types";
import { BaseQueueEvent } from "@/queue";
import { Context } from "@/tracing";

export const rule10 = wrapper(
  { name: "rule10", file: __filename },
  async (ctx: Context, event: BaseQueueEvent<Exam>) => {
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

    const statsObject = await persistence.createObject<ExamStats>(
      ctx,
      {
        object_type: "exam_stats",
        exam: event.current.id,
        student_counter: studentsCountInAcademicYear,
        examined_students: 0,
      },
      { author: event.author }
    );

    await persistence.updateObject<Exam>(
      ctx,
      event.current.id,
      { stats: statsObject.id },
      { author: event.author }
    );
  }
);
