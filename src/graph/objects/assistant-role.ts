import { ObjectConfig } from "@/graph";
import {
  OwnerViewVirtualExecutor,
  SpacePermissionExecutors,
} from "@/graph/common";
import { serializeDate } from "@/persistence/commons/serialize-date";

export default {
  code: "R4",
  cacheLevel: "external",
  deletedBy: ["virtual:space_admin"],
  views: {
    _default: {
      GET: ["virtual:owner", "virtual:space_member"],
      POST: [],
      PATCH: ["virtual:owner"],
    },
    system_controlled: {
      GET: ["virtual:owner", "virtual:space_member"],
      POST: [],
      PATCH: [],
    },
    admin_controlled: {
      GET: ["virtual:owner", "virtual:space_member"],
      POST: [],
      PATCH: ["virtual:space_admin"],
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
      space_member: {
        pre: ["all"],
        execute: SpacePermissionExecutors.space_member,
      },
    },
  },
  fields: {
    space: {
      type: "object-id",
      objectTypes: ["space"],
      view: "system_controlled",
      required: true,
      deepDeleteFromEdges: ["assistants"],
    },
    permissions: {
      type: "array:value-set",
      valueSet: "space-permission",
      view: "admin_controlled",
    },
    user: {
      type: "object-id",
      objectTypes: ["user"],
      required: true,
      view: "system_controlled",
      deepDeleteFromEdges: ["roles"],
    },
    contacts: {
      type: "array:struct",
      struct: "contact-point",
    },
    last_read_notification: {
      type: "date",
      default: () => serializeDate(new Date()),
      view: "user_private",
    },
  },
  edges: {},
} as ObjectConfig;
