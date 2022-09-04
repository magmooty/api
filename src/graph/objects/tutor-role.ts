import { ObjectConfig } from "@/graph";
import { OwnerViewVirtualExecutor } from "@/graph/common";

export default {
  code: "R1",
  cacheLevel: "external",
  views: {
    _default: {
      GET: ["public"],
      POST: ["all"],
      PATCH: ["virtual:owner"],
    },
    create_only: {
      GET: ["virtual:owner"],
      POST: ["all"],
      // FEATURE FLAG OFF
      // POST: ["virtual:has_invite", "virtual:space_owner"],
      PATCH: [],
    },
    system_controlled: {
      GET: ["virtual:owner"],
      POST: [],
      PATCH: [],
    },
  },
  virtuals: {
    views: {
      owner: {
        pre: ["all"],
        execute: OwnerViewVirtualExecutor,
      },
    },
  },
  fields: {
    payment_methods: {
      type: "array:struct",
      struct: "payment-method",
    },
    user: {
      type: "object-id",
      objectTypes: ["user"],
      view: "system_controlled",
      default: (object, author) => (author ? author.id : undefined),
    },
    contacts: {
      type: "array:struct",
      struct: "contact-point",
    },
    space: {
      type: "object-id",
      objectTypes: ["space"],
      view: "create_only",
      required: true,
    },
  },
  edges: {},
} as ObjectConfig;
