import { ObjectConfig } from "@/graph";
import { SpacePermissionsViewVirtuals } from "@/graph/common";

export default {
  code: "T2",
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
    student_counter: {
      type: "counter",
    },
    academic_year: {
      type: "object-id",
      objectTypes: ["academic_year"],
      required: true,
    },
  },
  edges: {},
} as ObjectConfig;
