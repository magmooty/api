import { persistence, search, wrapper } from "@/components";
import { Exam, ExamLog } from "@/graph/objects/types";
import { examMaxDate } from "@/graph/util/exam";
import { QueueEvent } from "@/queue";
import { Context } from "@/tracing";

export const rule22 = wrapper(
  { name: "rule22", file: __filename },
  async (ctx: Context, event: QueueEvent<Exam>) => {
    if (!event.current) {
      return;
    }

    const maxDate = examMaxDate(event.current.time_table);

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

        await persistence.createObject<ExamLog>(ctx, {
          object_type: "exam_log",
          student,
          exam: event.current.id,
        });
      },
      { lean: true }
    );
  }
);
