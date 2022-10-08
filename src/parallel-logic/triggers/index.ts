import * as all from "./all";
import * as billableItem from "./billable-item";
import * as billableItemLog from "./billable-item-log";
import * as exam from "./exam";
import * as examLog from "./exam-log";
import * as studentRole from "./student-role";
import * as tutorRole from "./tutor-role";
import * as user from "./user";

export default {
  "POST user": user.onPost,
  "PATCH user": user.onPatch,

  "POST tutor_role": tutorRole.onPost,

  "POST student_role": studentRole.onPost,
  "PATCH student_role": studentRole.onPatch,
  "DELETE student_role": studentRole.onDelete,

  "POST exam": exam.onPost,

  "POST billable_item": billableItem.onPost,

  "POST billable_item_log": billableItemLog.onPost,
  "DELETE billable_item_log": billableItemLog.onPost,

  "POST exam_log": examLog.onPost,
  "DELETE exam_log": examLog.onPost,

  "DELETE all": all.onDelete,
} as const;
