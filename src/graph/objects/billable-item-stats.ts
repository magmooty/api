import { ObjectConfig } from "@/graph";
import { SpacePermissionExecutors } from "@/graph/common";

export default {
  code: "17",
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
    paid_students: {
      type: "counter",
    },
    billable_item: {
      type: "object-id",
      objectTypes: ["billable_item"],
      required: true,
    },
  },
  edges: {},
} as ObjectConfig;
