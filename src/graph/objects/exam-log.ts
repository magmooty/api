import { ObjectConfig } from "@/graph";
import { SpaceAdminVirtualExecutor } from "@/graph/common";

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
        execute: SpaceAdminVirtualExecutor,
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
    },
  },
  edges: {
    trails: {
      objectTypes: ["exam_log_trail"],
      view: "system_controlled",
    },
  },
} as ObjectConfig;
