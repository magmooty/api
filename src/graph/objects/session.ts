import { ObjectConfig } from "@/graph";
import { OwnerViewVirtualExecutor } from "@/graph/common";

export default {
  code: "Z2",
  cacheLevel: "onlyCache",
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
    name: {
      type: "string",
    },
    user: {
      type: "object-id",
      objectTypes: ["user"],
    },
    roles: {
      type: "array:string",
    },
    expiresAt: {
      type: "date",
    },
  },
  edges: {},
} as ObjectConfig;
