import { ObjectConfig } from "@/graph";
import { SpacePermissionsViewVirtuals } from "@/graph/common";

export default {
  code: "16",
  cacheLevel: "external",
  deletedBy: ["virtual:space_admin"],
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
  deepDeletion: [
    {
      index: "billable_item_log",
      property: "billable_item",
    },
  ],
  virtuals: {
    views: SpacePermissionsViewVirtuals,
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
      deepDelete: true,
    },
  },
  edges: {
    trails: {
      objectTypes: ["billable_item_trail"],
      view: "system_controlled",
      deepDelete: "object",
    },
  },
} as ObjectConfig;
