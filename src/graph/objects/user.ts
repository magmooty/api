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
    system_controlled: {
      GET: ["virtual:owner"],
      POST: [],
      PATCH: [],
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
    gender: {
      type: "value-set",
      valueSet: "user-gender",
      default: () => "unknown",
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
      view: "system_controlled",
    },
    system_user: {
      type: "object-id",
      objectTypes: ["system-user"],
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
