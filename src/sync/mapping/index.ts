import academicYear from "./academic-year";
import assistantSpaceInvite from "./assistant-space-invite";
import billableItem from "./billable-item";
import billableItemLog from "./billable-item-log";
import exam from "./exam";
import examGradeGroupTemplate from "./exam-grade-group-template";
import examLog from "./exam-log";
import notification from "./notification";
import studentRole from "./student-role";
import studyGroup from "./study-group";
import tutorRole from "./tutor-role";
import user from "./user";

export const mappings = {
  user,
  notification,
  academic_year: academicYear,
  billable_item: billableItem,
  billable_item_log: billableItemLog,
  exam_grade_group_template: examGradeGroupTemplate,
  exam,
  exam_log: examLog,
  student_role: studentRole,
  study_group: studyGroup,
  tutor_role: tutorRole,
  assistant_space_invite: assistantSpaceInvite,
};

export const indexNames = Object.keys(mappings);

export type IndexName = keyof typeof mappings;
