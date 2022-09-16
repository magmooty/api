import { ObjectConfig } from "@/graph";
import { SpaceAdminVirtualExecutor } from "@/graph/common";

export default {
  code: "T1",
  cacheLevel: "external",
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
    },
    year: {
      type: "number",
    },
    space: {
      type: "object-id",
      objectTypes: ["space"],
    },
    stats: {
      type: "object-id",
      objectTypes: ["academic_year_stats"],
      view: "system_controlled",
    },
  },
  edges: {
    trails: {
      objectTypes: ["academic_year_trail"],
      view: "system_controlled",
    },
  },
} as ObjectConfig;
