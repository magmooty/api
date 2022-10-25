import { ObjectConfig } from "@/graph";
import { OwnerViewVirtualExecutor } from "@/graph/common";

export default {
  code: "Z5",
  cacheLevel: "external",
  deletedBy: ["virtual:owner"],
  deepDeletion: [
    {
      index: "academic_year",
      property: "space",
    },
    {
      index: "exam_grade_group_template",
      property: "space",
    },
    {
      index: "tutor_role",
      property: "space",
    },
  ],
  views: {
    _default: {
      GET: ["public"],
      POST: ["all"],
      PATCH: ["virtual:owner"],
    },
    system_controlled: {
      GET: ["virtual:space_admin"],
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
      type: "string",
    },
    owner: {
      type: "object-id",
      objectTypes: ["user"],
      default: (object, author) => (author ? author : undefined),
    },
  },
  edges: {
    assistants: {
      objectTypes: ["assistant_role"],
      view: "system_controlled",
    },
    assistant_invitations: {
      objectTypes: ["assistant_space_invite"],
      view: "system_controlled",
    },
  },
} as ObjectConfig;
