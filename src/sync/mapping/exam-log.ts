import { IndexMapping } from "../types";

export default {
  mapping: {
    student: {
      type: "keyword",
    },
    exam: {
      type: "keyword",
    },
    degree: {
      type: "float",
    },
    attended: {
      type: "boolean",
    },
    updated_at: {
      type: "date",
    },
  },
} as IndexMapping;
