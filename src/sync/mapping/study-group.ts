import { IndexMapping } from "../types";

export default {
  mapping: {
    name: {
      type: "text",
    },
    space: {
      type: "keyword",
    },
    academic_year: {
      type: "keyword",
    },
    updated_at: {
      type: "date",
    },
  },
} as IndexMapping;
