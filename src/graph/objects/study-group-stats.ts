import { ObjectConfig } from "@/graph";
import { SpacePermissionExecutors } from "@/graph/common";

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
    views: {
      space_admin: {
        pre: ["all"],
        execute: SpacePermissionExecutors.space_admin,
      },
    },
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
