import { IndexMapping } from "../types";

export default {
  mapping: {
    space: {
      type: "keyword",
    },
    user: {
      type: "keyword",
    },
    updated_at: {
      type: "date",
    },
  },
} as IndexMapping;
