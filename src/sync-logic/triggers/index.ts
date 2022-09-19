import * as academicYear from "./academic-year";

export default {
  "POST academic_year": academicYear.onPost,
} as const;
