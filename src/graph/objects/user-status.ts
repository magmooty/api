import { ObjectConfig } from "@/graph";
import { OwnerViewVirtualExecutor } from "@/graph/common";

export default {
  code: "Z4",
  cacheLevel: "external",
  views: {
    _default: {
      GET: ["virtual:owner"],
      POST: [],
      PATCH: [],
    },
  },
  virtuals: {
    views: {
      owner: {
        pre: ["all"],
        execute: OwnerViewVirtualExecutor,
      },
    },
  },
  fields: {
    status: {
      type: "value-set",
      valueSet: "user-status",
    },
    set_at: {
      type: "date",
    },
    set_by: {
      type: "object-id",
      objectTypes: ["user"],
    },
    user: {
      type: "object-id",
      objectTypes: ["user"],
    },
  },
  edges: {},
} as ObjectConfig;
