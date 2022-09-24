import * as tutorRole from "./tutor-role";
import * as user from "./user";
import * as all from "./all";

export default {
  "POST user": user.onPost,
  "PATCH user": user.onPatch,
  "POST tutor_role": tutorRole.onPost,

  "DELETE all": all.onDelete,
} as const;
