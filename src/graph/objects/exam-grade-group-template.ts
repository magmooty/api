import { ObjectConfig } from "@/graph";
import { SpaceAdminVirtualExecutor } from "@/graph/common";

export default {
  code: "14",
  cacheLevel: "external",
  deletedBy: ["virtual:space_admin"],
  views: {
    _default: {
      GET: ["virtual:space_admin"],
      POST: ["virtual:space_admin"],
      PATCH: ["virtual:space_admin"],
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
    name: {
      type: "string",
      required: true,
    },
    grade_groups: {
      type: "array:struct",
      struct: "exam-grade-group",
    },
    space: {
      type: "object-id",
      objectTypes: ["space"],
    },
  },
  edges: {},
} as ObjectConfig;
