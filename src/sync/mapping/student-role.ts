import { IndexMapping } from "../types";

export default {
  mapping: {
    name: {
      type: "text",
    },
    academic_year: {
      type: "keyword",
    },
    study_group: {
      type: "keyword",
    },
    student_phones: {
      type: "keyword",
    },
    parent_phones: {
      type: "keyword",
    },
    phone_text: {
      type: "text",
    },
    updated_at: {
      type: "date",
    },
  },
} as IndexMapping;
