import { IndexMapping } from "../types";

export default {
  mapping: {
    name: {
      type: "text",
    },
    academic_year: {
      type: "keyword",
    },
    type: {
      type: "keyword",
    },
    has_no_date: {
      type: "boolean",
    },
    price: {
      type: "float",
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
