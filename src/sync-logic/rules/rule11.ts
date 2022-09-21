import { persistence, search, wrapper } from "@/components";
import {
  AcademicYear,
  AcademicYearStats,
  BillableItem,
  BillableItemStats,
  Exam,
  ExamStats,
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

    const itemSearchCriteria = {
      filters: {
        and: [
          {
            academic_year,
          },
        ],
        or: [
          {
            has_no_date: true,
          },
        ],
      },
      ranges: {
        or: [
          {
            property: "max_date",
            gte: event.current.created_at,
          },
        ],
      },
    };

    const { results: exams } = await search.search<Exam>(
      ctx,
      "exam",
      itemSearchCriteria
    );

    await Promise.all(
      exams.map(async (exam) => {
        await persistence.updateObject<ExamStats>(
          ctx,
          exam.stats,
          { student_counter: "+1" },
          { author: event.author }
        );
      })
    );

    const { results: billableItems } = await search.search<BillableItem>(
      ctx,
      "billable_item",
      itemSearchCriteria
    );

    await Promise.all(
      billableItems.map(async (billableItem) => {
        await persistence.updateObject<BillableItemStats>(
          ctx,
          billableItem.stats,
          { student_counter: "+1" },
          { author: event.author }
        );
      })
    );
  }
);
