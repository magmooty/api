import { ObjectConfig } from "@/graph";
import { ROLE_GROUP, SpaceAdminVirtualExecutor } from "@/graph/common";

export default {
  code: "T7",
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
    delta: {
      type: "json",
    },
    exam_log: {
      type: "object-id",
      objectTypes: ["exam_log"],
    },
    role: {
      type: "object-id",
      objectTypes: ROLE_GROUP,
    },
  },
  edges: {},
} as ObjectConfig;
