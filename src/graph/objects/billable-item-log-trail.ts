import { ObjectConfig } from "@/graph";
import { ROLE_GROUP, SpacePermissionsViewVirtuals } from "@/graph/common";

export default {
  code: "T8",
  cacheLevel: "external",
  views: {
    _default: {
      GET: ["virtual:space_admin"],
      POST: [],
      PATCH: [],
    },
  },
  virtuals: {
    views: SpacePermissionsViewVirtuals,
  },
  fields: {
    delta: {
      type: "json",
    },
    billable_item_log: {
      type: "object-id",
      objectTypes: ["billable_item_log"],
    },
    role: {
      type: "object-id",
      objectTypes: ROLE_GROUP,
    },
  },
  edges: {},
} as ObjectConfig;
