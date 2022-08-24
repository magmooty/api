import { ObjectConfig } from "@/graph";

export default {
  code: "Z3",
  cacheLevel: "none",
  views: {
    _default: {
      GET: [],
      POST: [],
      PATCH: [],
    },
  },
  virtuals: {
    views: {},
  },
  fields: {
    hash: {
      type: "string",
      required: true,
    },
  },
  edges: {},
} as ObjectConfig;
