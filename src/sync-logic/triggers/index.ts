import * as academicYear from "./academic-year";
import * as studyGroup from "./study-group";

export default {
  "POST academic_year": academicYear.onPost,
  "POST study_group": studyGroup.onPost,
} as const;
