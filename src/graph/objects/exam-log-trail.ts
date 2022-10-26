import { ObjectConfig } from "@/graph";
import { ROLE_GROUP, SpacePermissionsViewVirtuals } from "@/graph/common";

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
    views: SpacePermissionsViewVirtuals,
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
