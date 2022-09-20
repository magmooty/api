import { IndexMapping } from "../types";

export default {
  mapping: {
    student: {
      type: "keyword",
    },
    billable_item: {
      type: "keyword",
    },
    amount: {
      type: "float",
    },
    fully_paid_at: {
      type: "date",
    },
    updated_at: {
      type: "date",
    },
  },
} as IndexMapping;
