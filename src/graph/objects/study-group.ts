import { ObjectConfig } from "@/graph";
import { SpaceAdminVirtualExecutor } from "@/graph/common";

export default {
  code: "10",
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
    name: {
      type: "string",
      required: true,
    },
    academic_year: {
      type: "object-id",
      objectTypes: ["academic_year"],
      required: true,
    },
    time_table: {
      type: "array:struct",
      struct: "study-group-time-table",
    },
    stats: {
      type: "object-id",
      objectTypes: ["study_group_stats"],
      view: "system_controlled",
      deepDelete: true,
    },
  },
  edges: {
    trails: {
      objectTypes: ["study_group_trail"],
      view: "system_controlled",
      deepDelete: "object",
    },
  },
} as ObjectConfig;
