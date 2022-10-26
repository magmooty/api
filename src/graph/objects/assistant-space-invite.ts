import { ObjectConfig } from "@/graph";
import { SpacePermissionExecutors } from "@/graph/common";
import { AssistantSpaceInviteHasInviteExecutor } from "@/graph/extra/assistant-space-invite/virtuals";

export default {
  code: "R5",
  cacheLevel: "external",
  deletedBy: ["virtual:space_admin"],
  views: {
    _default: {
      GET: ["virtual:space_admin", "virtual:invited_user"],
      POST: ["virtual:space_admin"],
      PATCH: ["virtual:space_admin"],
    },
  },
  virtuals: {
    views: {
      space_admin: {
        pre: ["all"],
        execute: SpacePermissionExecutors.space_admin,
      },
      invited_user: {
        pre: ["all"],
        execute: AssistantSpaceInviteHasInviteExecutor,
      },
    },
  },
  fields: {
    invited_id: {
      type: "string",
    },
    space: {
      type: "object-id",
      objectTypes: ["space"],
    },
    permissions: {
      type: "array:value-set",
      valueSet: "space-permission",
    },
  },
  edges: {},
} as ObjectConfig;
