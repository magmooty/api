import * as user from "./user";

export default {
  "POST user": user.onPost,
  "PATCH user": user.onPatch,
} as const;
