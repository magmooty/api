import { IndexMapping } from "../types";

export default {
  mapping: {
    space: {
      type: "keyword",
    },
    invited_id: {
      type: "keyword",
    },
    updated_at: {
      type: "date",
    },
  },
} as IndexMapping;
