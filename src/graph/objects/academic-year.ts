import { ObjectConfig } from "@/graph";
import { SpacePermissionExecutors } from "@/graph/common";

export default {
  code: "T1",
  cacheLevel: "external",
  deletedBy: ["virtual:space_admin"],
  deepDeletion: [
    {
      index: "study_group",
      property: "academic_year",
    },
    {
      index: "exam",
      property: "academic_year",
    },
    {
      index: "billable_item",
      property: "academic_year",
    },
  ],
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
    name: {
      type: "string",
      required: true,
    },
    space: {
      type: "object-id",
      objectTypes: ["space"],
      required: true,
    },
    stats: {
      type: "object-id",
      objectTypes: ["academic_year_stats"],
      view: "system_controlled",
      deepDelete: true,
    },
  },
  edges: {
    trails: {
      objectTypes: ["academic_year_trail"],
      view: "system_controlled",
      deepDelete: "object",
    },
  },
} as ObjectConfig;
