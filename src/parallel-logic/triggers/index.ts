import * as all from "./all";
import * as studentRole from "./student-role";
import * as tutorRole from "./tutor-role";
import * as user from "./user";

export default {
  "POST user": user.onPost,
  "PATCH user": user.onPatch,

  "POST tutor_role": tutorRole.onPost,

  "POST student_role": studentRole.onPost,
  "DELETE student_role": studentRole.onDelete,

  "DELETE all": all.onDelete,
} as const;
