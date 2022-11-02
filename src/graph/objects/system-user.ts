import { ObjectConfig } from "@/graph";

export default {
  code: "Z3",
  systemObject: true,
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
    last_acceptable_session_id: {
      type: "number",
      default: () => 0,
    },
    last_session_id: {
      type: "counter",
    },
  },
  edges: {},
} as ObjectConfig;
