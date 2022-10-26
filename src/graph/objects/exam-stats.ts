import { ObjectConfig } from "@/graph";
import { SpacePermissionsViewVirtuals } from "@/graph/common";

export default {
  code: "13",
  cacheLevel: "external",
  views: {
    _default: {
      GET: ["virtual:space_admin"],
      POST: [],
      PATCH: [],
    },
  },
  virtuals: {
    views: SpacePermissionsViewVirtuals,
  },
  fields: {
    student_counter: {
      type: "counter",
    },
    examined_students: {
      type: "counter",
    },
    grade_group_counts: {
      type: "struct",
      struct: "exam-grade-group-stats",
    },
    exam: {
      type: "object-id",
      objectTypes: ["exam"],
      required: true,
    },
  },
  edges: {},
} as ObjectConfig;
