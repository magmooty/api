import * as user from "./user";
import * as notification from "./notification";

export default {
  "POST user": user.onPost,
  "PATCH user": user.onPatch,
  "DELETE user": user.onDelete,

  "POST notification": notification.onPost,
  "PATCH notification": notification.onPatch,
  "DELETE notification": notification.onDelete,
} as const;
