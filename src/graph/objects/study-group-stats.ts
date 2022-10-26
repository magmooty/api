import { ObjectConfig } from "@/graph";
import { SpacePermissionsViewVirtuals } from "@/graph/common";

export default {
  code: "11",
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
    study_group: {
      type: "object-id",
      objectTypes: ["study_group"],
      required: true,
    },
  },
  edges: {},
} as ObjectConfig;
