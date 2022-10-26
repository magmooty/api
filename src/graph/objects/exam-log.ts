import { ObjectConfig } from "@/graph";
import { SpacePermissionExecutors } from "@/graph/common";

export default {
  code: "15",
  cacheLevel: "external",
  deletedBy: ["virtual:space_admin"],
  views: {
    _default: {
      GET: ["virtual:space_admin"],
      POST: ["virtual:space_admin"],
      PATCH: ["virtual:space_admin"],
    },
    system_controlled: {
      GET: ["virtual:space_admin"],
      POST: [],
      PATCH: [],
    },
  },
  virtuals: {
    views: {
      space_admin: {
        pre: ["all"],
        execute: SpacePermissionExecutors.space_admin,
      },
    },
  },
  fields: {
    student: {
      type: "object-id",
      objectTypes: ["student_role"],
      required: true,
    },
    attended: {
      type: "boolean",
      default: () => false,
    },
    degree: {
      type: "number",
    },
    exam: {
      type: "object-id",
      objectTypes: ["exam"],
      required: true,
    },
  },
  edges: {
    trails: {
      objectTypes: ["exam_log_trail"],
      view: "system_controlled",
      deepDelete: "object",
    },
  },
} as ObjectConfig;
