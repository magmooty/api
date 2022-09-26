import * as all from "./all";
import * as billableItemLog from "./billable-item-log";
import * as examLog from "./exam-log";
import * as studentRole from "./student-role";
import * as tutorRole from "./tutor-role";
import * as user from "./user";

export default {
  "POST user": user.onPost,
  "PATCH user": user.onPatch,

  "POST tutor_role": tutorRole.onPost,

  "POST student_role": studentRole.onPost,
  "DELETE student_role": studentRole.onDelete,

  "POST billable_item_log": billableItemLog.onPost,
  "DELETE billable_item_log": billableItemLog.onPost,

  "POST exam_log": examLog.onPost,
  "DELETE exam_log": examLog.onPost,

  "DELETE all": all.onDelete,
} as const;
