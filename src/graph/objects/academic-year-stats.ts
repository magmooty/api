import { ObjectConfig } from "@/graph";
import { SpaceAdminVirtualExecutor } from "@/graph/common";

export default {
  code: "T2",
  cacheLevel: "external",
  views: {
    _default: {
      GET: ["virtual:space_admin"],
      POST: [],
      PATCH: [],
    },
  },
  virtuals: {
    views: {
      space_admin: {
        pre: ["all"],
        execute: SpaceAdminVirtualExecutor,
      },
    },
  },
  fields: {
    student_counter: {
      type: "counter",
    },
    academic_year: {
      type: "object-id",
      objectTypes: ["academic_year"],
      required: true,
    },
  },
  edges: {},
} as ObjectConfig;
