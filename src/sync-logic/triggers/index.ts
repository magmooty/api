import * as academicYear from "./academic-year";
import * as assistantRole from "./assistant-role";
import * as billableItem from "./billable-item";
import * as exam from "./exam";
import * as studentRole from "./student-role";
import * as studyGroup from "./study-group";
import * as tutorRole from "./tutor-role";

export default {
  "POST academic_year": academicYear.onPost,

  "POST study_group": studyGroup.onPost,

  "POST exam": exam.onPost,

  "POST billable_item": billableItem.onPost,

  "POST tutor_role": tutorRole.onPost,

  "POST student_role": studentRole.onPost,

  "POST assistant_role": assistantRole.onPost,
  "PATCH assistant_role": assistantRole.onPost,
} as const;
