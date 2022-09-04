import * as tutorRole from "./tutor-role";
import * as user from "./user";

export default {
  "POST user": user.onPost,
  "PATCH user": user.onPatch,
  "POST tutor_role": tutorRole.onPost,
} as const;
