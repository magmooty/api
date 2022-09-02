import { ObjectConfig } from "@/graph";
import { OwnerViewVirtualExecutor } from "@/graph/common";

export default {
  code: "R1",
  cacheLevel: "external",
  views: {
    _default: {
      GET: ["public"],
      POST: ["all"],
      PATCH: ["virtual:owner"],
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
    owner: {
      type: "object-id",
      objectTypes: ["user"],
    },
  },
  edges: {},
} as ObjectConfig;
