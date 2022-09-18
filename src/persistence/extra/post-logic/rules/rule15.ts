import { persistence, wrapper } from "@/components";
import { ExamStats, Exam, CounterModifier } from "@/graph/objects/types";
import { Context } from "@/tracing";
import { PostLogicPayload } from "..";

export const rule15 = wrapper(
  { name: "rule15", file: __filename },
  async (ctx: Context, object: ExamStats, payload: PostLogicPayload) => {
    const { grade_group_counts: gradeGroupCountsPayload } = payload as {
      grade_group_counts: { [key: string]: CounterModifier };
    };

    if (!gradeGroupCountsPayload) {
      return;
    }

    const { grade_groups: examGradeGroups } = await persistence.getObject<Exam>(
      ctx,
      object.exam
    );

    const ids = (examGradeGroups || []).map(
      (grade_group) => grade_group.grade_group_id
    );

    const gradeGroupCountsResult: any = {};

    for (const id of ids) {
      if (!gradeGroupCountsPayload[id]) {
        gradeGroupCountsResult[id] = await persistence._internalGetCounter(
          ctx,
          object.id,
          `grade_group_counts.${id}`
        );
        continue;
      }

      const value = await persistence._internalSetCounter(
        ctx,
        object.id,
        `grade_group_counts.${id}`,
        gradeGroupCountsPayload[id]
      );

      gradeGroupCountsResult[id] = value;
    }

    object.grade_group_counts = gradeGroupCountsResult;
  }
);
