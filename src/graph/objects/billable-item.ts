import { ObjectConfig } from "@/graph";
import { SpaceAdminVirtualExecutor } from "@/graph/common";

export default {
  code: "16",
  cacheLevel: "external",
  views: {
    _default: {
      GET: ["virtual:space_admin"],
      POST: ["virtual:space_admin"],
      PATCH: ["virtual:space_admin"],
    },
    system_controlled: {
      GET: ["virtual:space_admin"],
      POST: [],
      PATCH: [],
    },
  },
  virtuals: {
    views: {
      space_admin: {
        pre: ["all"],
        execute: SpaceAdminVirtualExecutor,
      },
    },
  },
  fields: {
    name: {
      type: "string",
      required: true,
    },
    academic_year: {
      type: "object-id",
      objectTypes: ["academic_year"],
      required: true,
    },
    type: {
      type: "value-set",
      valueSet: "billable-item-type",
      required: true,
    },
    price: {
      type: "number",
    },
    time_table: {
      type: "array:struct",
      struct: "billable-item-time-table",
    },
    stats: {
      type: "object-id",
      objectTypes: ["billable_item_stats"],
      view: "system_controlled",
    },
  },
  edges: {
    trails: {
      objectTypes: ["billable_item_trail"],
      view: "system_controlled",
    },
  },
} as ObjectConfig;
