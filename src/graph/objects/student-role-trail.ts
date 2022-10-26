import { ObjectConfig } from "@/graph";
import { ROLE_GROUP, SpacePermissionExecutors } from "@/graph/common";

export default {
  code: "T9",
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
        execute: SpacePermissionExecutors.space_admin,
      },
    },
  },
  fields: {
    delta: {
      type: "json",
    },
    student_role: {
      type: "object-id",
      objectTypes: ["student_role"],
    },
    role: {
      type: "object-id",
      objectTypes: ROLE_GROUP,
    },
  },
  edges: {},
} as ObjectConfig;
