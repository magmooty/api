import { ObjectConfig } from "..";
import academicYear from "./academic-year";
import academicYearStats from "./academic-year-stats";
import academicYearTrail from "./academic-year-trail";
import exam from "./exam";
import examStats from "./exam-stats";
import examTrail from "./exam-trail";
import notification from "./notification";
import session from "./session";
import space from "./space";
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
  exam_trail: examTrail
} as { [key: string]: ObjectConfig };
