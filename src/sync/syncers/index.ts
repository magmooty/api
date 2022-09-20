import * as user from "./user";
import * as notification from "./notification";
import * as academicYear from "./academic-year";

export default {
  "POST user": user.onPost,
  "PATCH user": user.onPatch,
  "DELETE user": user.onDelete,

  "POST notification": notification.onPost,
  "PATCH notification": notification.onPatch,
  "DELETE notification": notification.onDelete,

  "POST academic_year": academicYear.onPost,
  "PATCH academic_year": academicYear.onPatch,
  "DELETE academic_year": academicYear.onDelete,
} as const;
