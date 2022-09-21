import * as academicYear from "./academic-year";
import * as studyGroup from "./study-group";
import * as exam from "./exam";
import * as studentRole from "./student-role";

export default {
  "POST academic_year": academicYear.onPost,
  "POST study_group": studyGroup.onPost,
  "POST exam": exam.onPost,
  "POST student_role": studentRole.onPost,
} as const;
