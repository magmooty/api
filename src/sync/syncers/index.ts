import * as academicYear from "./academic-year";
import * as assistantRole from "./assistant-role";
import * as billableItem from "./billable-item";
import * as billableItemLog from "./billable-item-log";
import * as exam from "./exam";
import * as examGradeGroupTemplate from "./exam-grade-group-template";
import * as examLog from "./exam-log";
import * as notification from "./notification";
import * as studentRole from "./student-role";
import * as studyGroup from "./study-group";
import * as tutorRole from "./tutor-role";
import * as user from "./user";

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

  "POST tutor_role": tutorRole.onPost,
  "PATCH tutor_role": tutorRole.onPatch,
  "DELETE tutor_role": tutorRole.onDelete,

  "POST billable_item": billableItem.onPost,
  "PATCH billable_item": billableItem.onPatch,
  "DELETE billable_item": billableItem.onDelete,

  "POST billable_item_log": billableItemLog.onPost,
  "PATCH billable_item_log": billableItemLog.onPatch,
  "DELETE billable_item_log": billableItemLog.onDelete,

  "POST exam_grade_group_template": examGradeGroupTemplate.onPost,
  "PATCH exam_grade_group_template": examGradeGroupTemplate.onPatch,
  "DELETE exam_grade_group_template": examGradeGroupTemplate.onDelete,

  "POST exam_log": examLog.onPost,
  "PATCH exam_log": examLog.onPatch,
  "DELETE exam_log": examLog.onDelete,

  "POST exam": exam.onPost,
  "PATCH exam": exam.onPatch,
  "DELETE exam": exam.onDelete,

  "POST student_role": studentRole.onPost,
  "PATCH student_role": studentRole.onPatch,
  "DELETE student_role": studentRole.onDelete,

  "POST study_group": studyGroup.onPost,
  "PATCH study_group": studyGroup.onPatch,
  "DELETE study_group": studyGroup.onDelete,

  "POST assistant_role": assistantRole.onPost,
  "PATCH assistant_role": assistantRole.onPatch,
  "DELETE assistant_role": assistantRole.onDelete,
} as const;
