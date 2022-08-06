import { ObjectConfig } from "@/graph";
import { OwnerViewVirtualExecutor } from "@/graph/common";

export default {
  code: "Z1",
  cacheLevel: "external",
  views: {
    _default: {
      GET: ["public"],
      POST: [],
      PATCH: ["virtual:owner"],
    },
    system: {
      GET: ["virtual:owner"],
      POST: [],
      PATCH: [],
    },
    private: {
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
    },
  },
  fields: {
    email: {
      type: "string",
      unique: true,
      required: true,
    },
    email_verified: {
      type: "boolean",
      default: () => false,
    },
    status: {
      type: "value-set",
      valueSet: "user-status",
      default: () => "created",
    },
    last_read_notification: {
      type: "date",
      default: () => new Date(),
    },
  },
  edges: {
    roles: {
      objectTypes: ["tutor_role"],
    },
    statuses: {
      objectTypes: ["user_status"],
    },
  },
} as ObjectConfig;
