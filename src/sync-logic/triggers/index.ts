import * as academicYear from "./academic-year";
import * as billableItem from "./billable-item";
import * as exam from "./exam";
import * as studyGroup from "./study-group";

export default {
  "POST academic_year": academicYear.onPost,
  "POST study_group": studyGroup.onPost,
  "POST exam": exam.onPost,
  "POST billable_item": billableItem.onPost,
} as const;
