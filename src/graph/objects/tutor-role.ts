import { ObjectConfig } from "@/graph";
import {
  OwnerViewVirtualExecutor,
  SpaceOwnerVirtualExecutor,
} from "@/graph/common";
import { serializeDate } from "@/persistence/commons/serialize-date";

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
      POST: ["virtual:space_owner"],
      PATCH: [],
    },
    system_controlled: {
      GET: ["virtual:owner"],
      POST: [],
      PATCH: [],
    },
    user_private: {
      GET: ["virtual:owner"],
      POST: [],
      PATCH: ["virtual:owner"],
    },
  },
  virtuals: {
    views: {
      owner: {
        pre: ["all"],
        execute: OwnerViewVirtualExecutor,
      },
      space_owner: {
        pre: ["all"],
        execute: SpaceOwnerVirtualExecutor,
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
      default: (object, author) => (author ? author : undefined),
      deepDeleteFromEdges: ["roles"],
    },
    last_read_notification: {
      type: "date",
      default: () => serializeDate(new Date()),
      view: "user_private",
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
