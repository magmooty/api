import { ObjectConfig } from "@/graph";
import { ROLE_GROUP, SpaceAdminVirtualExecutor } from "@/graph/common";

export default {
  code: "T5",
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
    billable_item: {
      type: "object-id",
      objectTypes: ["billable_item"],
    },
    role: {
      type: "object-id",
      objectTypes: ROLE_GROUP,
    },
  },
  edges: {},
} as ObjectConfig;
