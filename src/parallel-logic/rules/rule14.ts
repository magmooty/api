import { persistence, wrapper } from "@/components";
import {
  StudyGroup,
  StudyGroupStats,
  StudentRole,
} from "@/graph/objects/types";
import { QueueEvent } from "@/queue";
import { Context } from "@/tracing";

export const rule14 = wrapper(
  { name: "rule14", file: __filename },
  async (ctx: Context, event: QueueEvent<StudentRole>) => {
    if (!event.current || !event.previous) {
      return;
    }

    const { study_group: oldStudyGroupId } = event.previous;

    const oldStudyGroup = await persistence.getObject<StudyGroup>(
      ctx,
      oldStudyGroupId
    );

    await persistence.updateObject<StudyGroupStats>(
      ctx,
      oldStudyGroup.stats,
      {
        student_counter: "-1",
      },
      { author: event.author }
    );

    const { study_group: newStudyGroupId } = event.current;

    const newStudyGroup = await persistence.getObject<StudyGroup>(
      ctx,
      newStudyGroupId
    );

    await persistence.updateObject<StudyGroupStats>(
      ctx,
      newStudyGroup.stats,
      {
        student_counter: "+1",
      },
      { author: event.author }
    );
  }
);
