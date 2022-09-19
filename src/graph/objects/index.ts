import { ObjectConfig } from "..";
import academicYear from "./academic-year";
import academicYearStats from "./academic-year-stats";
import academicYearTrail from "./academic-year-trail";
import billableItem from "./billable-item";
import billableItemLog from "./billable-item-log";
import billableItemLogTrail from "./billable-item-log-trail";
import billableItemStats from "./billable-item-stats";
import billableItemTrail from "./billable-item-trail";
import exam from "./exam";
import examGradeGroupTemplate from "./exam-grade-group-template";
import examLog from "./exam-log";
import examLogTrail from "./exam-log-trail";
import examStats from "./exam-stats";
import examTrail from "./exam-trail";
import notification from "./notification";
import session from "./session";
import space from "./space";
import studentRole from "./student-role";
import studentRoleTrail from "./student-role-trail";
import studyGroup from "./study-group";
import studyGroupStats from "./study-group-stats";
import studyGroupTrail from "./study-group-trail";
import systemUser from "./system-user";
import tutorRole from "./tutor-role";
import user from "./user";
import userStatus from "./user-status";

export default {
  user,
  session,
  system_user: systemUser,
  space,
  notification,
  user_status: userStatus,
  tutor_role: tutorRole,
  academic_year: academicYear,
  academic_year_stats: academicYearStats,
  academic_year_trail: academicYearTrail,
  study_group: studyGroup,
  study_group_stats: studyGroupStats,
  study_group_trail: studyGroupTrail,
  exam: exam,
  exam_stats: examStats,
  exam_trail: examTrail,
  exam_grade_group_template: examGradeGroupTemplate,
  exam_log: examLog,
  exam_log_trail: examLogTrail,
  student_role: studentRole,
  student_role_trail: studentRoleTrail,
  billable_item: billableItem,
  billable_item_trail: billableItemTrail,
  billable_item_stats: billableItemStats,
  billable_item_log: billableItemLog,
  billable_item_log_trail: billableItemLogTrail,
} as { [key: string]: ObjectConfig };
