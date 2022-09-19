import { persistence, wrapper } from "@/components";
import { StudyGroup, StudyGroupStats } from "@/graph/objects/types";
import { BaseQueueEvent } from "@/queue";
import { Context } from "@/tracing";

export const rule9 = wrapper(
  { name: "rule9", file: __filename },
  async (ctx: Context, event: BaseQueueEvent<StudyGroup>) => {
    if (!event.current) {
      return;
    }

    const statsObject = await persistence.createObject<StudyGroupStats>(
      ctx,
      {
        object_type: "study_group_stats",
        study_group: event.current.id,
        student_counter: 0,
      },
      { author: event.author }
    );

    await persistence.updateObject<StudyGroup>(
      ctx,
      event.current.id,
      { stats: statsObject.id },
      { author: event.author }
    );
  }
);
