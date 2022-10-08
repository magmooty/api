import { persistence, wrapper } from "@/components";
import { Exam, ExamStats } from "@/graph/objects/types";
import { BaseQueueEvent } from "@/queue";
import { Context } from "@/tracing";

export const rule10 = wrapper(
  { name: "rule10", file: __filename },
  async (ctx: Context, event: BaseQueueEvent<Exam>) => {
    if (!event.current) {
      return;
    }

    const statsObject = await persistence.createObject<ExamStats>(
      ctx,
      {
        object_type: "exam_stats",
        exam: event.current.id,
        student_counter: 0,
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
