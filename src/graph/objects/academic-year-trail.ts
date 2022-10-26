import { ObjectConfig } from "@/graph";
import { ROLE_GROUP, SpacePermissionsViewVirtuals } from "@/graph/common";

export default {
  code: "T3",
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
    academic_year: {
      type: "object-id",
      objectTypes: ["academic_year"],
    },
    role: {
      type: "object-id",
      objectTypes: ROLE_GROUP,
    },
  },
  edges: {},
} as ObjectConfig;
