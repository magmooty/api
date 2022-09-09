import { ObjectConfig, ObjectTTL } from "@/graph";
import { OwnerViewVirtualExecutor } from "@/graph/common";

export default {
  code: "N1",
  ttl: ObjectTTL.Active,
  cacheLevel: "external",
  views: {
    _default: {
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
    type: {
      type: "value-set",
      valueSet: "notification-type",
      required: true,
    },
    data: {
      type: "json",
    },
    icon: {
      type: "string",
    },
    user: {
      type: "object-id",
      objectTypes: ["user"],
      required: true,
      stripDisallowed: true,
    },
    role: {
      type: "object-id",
      objectTypes: ["tutor_role"],
    },
    alert: {
      type: "boolean",
      default: () => false,
    },
    level: {
      type: "value-set",
      valueSet: "notification-criticality-level",
      default: () => "info",
    },
  },
  edges: {},
} as ObjectConfig;
