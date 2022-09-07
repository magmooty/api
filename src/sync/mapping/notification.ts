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
  },
} as IndexMapping;
