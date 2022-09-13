import { IndexMapping } from "../types";

export default {
  mapping: {
    user: {
      type: "keyword",
    },
    type: {
      type: "keyword",
    },
    role: {
      type: "keyword",
    },
    updated_at: {
      type: "date",
    },
  },
} as IndexMapping;
