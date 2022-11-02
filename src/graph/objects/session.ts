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
    token: {
      type: "string",
      required: true,
    },
    session_id: {
      type: "number",
      required: true,
    },
    user: {
      type: "object-id",
      objectTypes: ["user"],
      required: true,
    },
    roles: {
      type: "array:string",
    },
    expiresAt: {
      type: "date",
      required: true,
    },
  },
  edges: {},
} as ObjectConfig;
