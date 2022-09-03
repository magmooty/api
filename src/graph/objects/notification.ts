import { ObjectConfig, ObjectTTL } from "@/graph";
import { OwnerViewVirtualExecutor } from "@/graph/common";

export default {
  code: "Z5",
  ttl: ObjectTTL.Active,
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
    user: {
      type: "object-id",
      objectTypes: ["user"],
      view: "system_controlled",
      required: true,
    },
    alert: {
      type: "boolean",
      view: "system_controlled",
      default: () => false,
    },
    level: {
      type: "value-set",
      view: "system_controlled",
      valueSet: "notification-criticality-level",
      default: () => "info",
    },
  },
  edges: {},
} as ObjectConfig;
