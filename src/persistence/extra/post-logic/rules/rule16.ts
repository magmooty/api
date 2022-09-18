import { persistence, wrapper } from "@/components";
import { Exam, ExamStats } from "@/graph/objects/types";
import { Context } from "@/tracing";

export const rule16 = wrapper(
  { name: "rule16", file: __filename },
  async (ctx: Context, object: ExamStats) => {
    const { grade_groups: examGradeGroups } = await persistence.getObject<Exam>(
      ctx,
      object.exam
    );

    const ids = (examGradeGroups || []).map(
      (grade_group) => grade_group.grade_group_id
    );

    const gradeGroupCountsResult: any = {};

    for (const id of ids) {
      gradeGroupCountsResult[id] = await persistence._internalGetCounter(
        ctx,
        object.id,
        `grade_group_counts.${id}`
      );
    }

    object.grade_group_counts = gradeGroupCountsResult;
  }
);
