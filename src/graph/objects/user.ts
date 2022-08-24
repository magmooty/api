import { ObjectConfig } from "@/graph";
import { OwnerViewVirtualExecutor } from "@/graph/common";
import { serializeDate } from "@/persistence/commons/serialize-date";

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
    system_private: {
      GET: [],
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
    name: {
      type: "string",
    },
    email: {
      type: "string",
      unique: true,
      schema: "email",
    },
    email_verified: {
      type: "boolean",
      default: () => false,
    },
    phone: {
      type: "string",
      unique: true,
      schema: "phone",
    },
    phone_verified: {
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
      default: () => serializeDate(new Date()),
    },
    system_user: {
      type: "object-id",
      objectTypes: ["system-user"],
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
