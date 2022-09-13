import { IndexMapping } from "../types";

export default {
  mapping: {
    name: {
      type: "text",
    },
    email: {
      type: "keyword",
    },
    email_text: {
      type: "text",
    },
    phone: {
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
