import { ObjectConfig } from "@/graph";
import { SpacePermissionExecutors } from "@/graph/common";

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
        execute: SpacePermissionExecutors.space_admin,
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
    user: {
      type: "object-id",
      objectTypes: ["user"],
      deepDeleteFromEdges: ["roles"],
      view: "system_controlled",
    },
    notes: {
      type: "string",
    },
  },
  edges: {
    trails: {
      objectTypes: ["student_role_trail"],
      view: "system_controlled",
      deepDelete: "object",
    },
  },
} as ObjectConfig;
