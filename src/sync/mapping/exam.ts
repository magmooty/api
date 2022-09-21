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
    has_no_date: {
      type: "boolean",
    },
    min_date: {
      type: "date",
    },
    max_date: {
      type: "date",
    },
    updated_at: {
      type: "date",
    },
  },
} as IndexMapping;
