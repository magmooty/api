import { ObjectConfig } from "@/graph";
import { SpaceAdminVirtualExecutor } from "@/graph/common";

export default {
  code: "R2",
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
      type: "array:struct",
      struct: "human-name",
    },
    academic_year: {
      type: "object-id",
      objectTypes: ["academic_year"],
    },
    study_group: {
      type: "object-id",
      objectTypes: ["study_group"],
    },
    contacts: {
      type: "array:struct",
      struct: "contact-point",
    },
    notes: {
      type: "string",
    },
  },
  edges: {
    trails: {
      objectTypes: ["student_role_trail"],
      view: "system_controlled",
    },
  },
} as ObjectConfig;
