import { ObjectConfig } from "@/graph";
import { SpacePermissionsViewVirtuals } from "@/graph/common";

export default {
  code: "18",
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
    views: SpacePermissionsViewVirtuals,
  },
  fields: {
    student: {
      type: "object-id",
      objectTypes: ["student_role"],
      required: true,
    },
    amount: {
      type: "number",
    },
    receipt_url: {
      type: "string",
    },
    billable_item: {
      type: "object-id",
      objectTypes: ["billable_item"],
    },
    fully_paid_at: {
      type: "date",
    },
  },
  edges: {
    trails: {
      objectTypes: ["billable_item_log_trail"],
      view: "system_controlled",
      deepDelete: "object",
    },
  },
} as ObjectConfig;
