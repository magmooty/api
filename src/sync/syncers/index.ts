import * as user from "./user";

export default {
  "POST user": user.onPost,
  "PATCH user": user.onPatch,
  "DELETE user": user.onDelete,
} as const;
