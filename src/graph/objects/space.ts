import { ObjectConfig } from "@/graph";
import { OwnerViewVirtualExecutor } from "@/graph/common";

export default {
  code: "Z5",
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
      default: (object, author) => (author ? author.id : undefined),
    },
    test_counter: {
      type: "counter",
    },
  },
  edges: {},
} as ObjectConfig;
