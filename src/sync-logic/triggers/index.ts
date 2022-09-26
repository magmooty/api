import * as academicYear from "./academic-year";
import * as studyGroup from "./study-group";
import * as exam from "./exam";

export default {
  "POST academic_year": academicYear.onPost,
  "POST study_group": studyGroup.onPost,
  "POST exam": exam.onPost,
} as const;
