import { persistence, wrapper } from "@/components";
import {
  AcademicYear,
  AcademicYearStats,
  StudentRole,
  StudyGroup,
  StudyGroupStats,
} from "@/graph/objects/types";
import { BaseQueueEvent } from "@/queue";
import { Context } from "@/tracing";

export const rule11 = wrapper(
  { name: "rule11", file: __filename },
  async (ctx: Context, event: BaseQueueEvent<StudentRole>) => {
    if (!event.current) {
      return;
    }

    const { academic_year, study_group } = event.current;

    const academicYear = await persistence.getObject<AcademicYear>(
      ctx,
      academic_year
    );

    await persistence.updateObject<AcademicYearStats>(
      ctx,
      academicYear.stats,
      {
        student_counter: "+1",
      },
      { author: event.author }
    );

    const studyGroup = await persistence.getObject<StudyGroup>(
      ctx,
      study_group
    );

    await persistence.updateObject<StudyGroupStats>(
      ctx,
      studyGroup.stats,
      {
        student_counter: "+1",
      },
      { author: event.author }
    );
  }
);
