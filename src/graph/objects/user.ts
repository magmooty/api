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
    user_private: {
      GET: ["virtual:owner"],
      POST: [],
      PATCH: ["virtual:owner"],
    },
    system_controlled: {
      GET: ["virtual:owner"],
      POST: [],
      PATCH: [],
      DELETE: [],
    },
    system_private: {
      GET: [],
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
    name: {
      type: "array:struct",
      struct: "human-name",
    },
    email: {
      type: "string",
      unique: true,
      schema: "email",
    },
    email_verified: {
      type: "boolean",
      default: () => false,
      view: "system_controlled",
    },
    phone: {
      type: "string",
      unique: true,
      schema: "phone",
    },
    phone_verified: {
      type: "boolean",
      default: () => false,
      view: "system_controlled",
    },
    status: {
      type: "value-set",
      valueSet: "user-status",
      default: () => "created",
      view: "system_controlled",
    },
    last_read_notification: {
      type: "date",
      default: () => serializeDate(new Date()),
      view: "user_private",
    },
    system_user: {
      type: "object-id",
      objectTypes: ["system_user"],
      view: "system_private",
    },
  },
  edges: {
    roles: {
      objectTypes: ["tutor_role"],
      view: "system_controlled",
    },
    statuses: {
      objectTypes: ["user_status"],
      view: "system_controlled",
    },
  },
} as ObjectConfig;
