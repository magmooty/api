export type ObjectId = string;

export type ObjectType =
  | "user"
  | "session"
  | "system_user"
  | "space"
  | "notification"
  | "user_status"
  | "tutor_role"
  | "academic_year"
  | "academic_year_stats"
  | "academic_year_trail"
  | "study_group"
  | "study_group_stats"
  | "study_group_trail"
  | "exam"
  | "exam_stats"
  | "exam_trail"
  | "exam_grade_group_template"
  | "exam_log"
  | "exam_log_trail"
  | "student_role"
  | "student_role_trail"
  | "billable_item"
  | "billable_item_trail"
  | "billable_item_stats"
  | "billable_item_log"
  | "billable_item_log_trail";

export type ObjectFieldValue =
  | string
  | string[]
  | number
  | number[]
  | boolean
  | Date
  | ObjectId
  | GraphObject
  | Object
  | CounterModifier
  | HumanName
  | PaymentMethod
  | ContactPoint
  | StudyGroupTimeTable
  | ExamTimeTable
  | ExamGradeGroup
  | ExamGradeGroupStats
  | BillableItemTimeTable
  | HumanName[]
  | PaymentMethod[]
  | ContactPoint[]
  | StudyGroupTimeTable[]
  | ExamTimeTable[]
  | ExamGradeGroup[]
  | ExamGradeGroupStats[]
  | BillableItemTimeTable[];

export type AppLocale = "ar" | "en";

export type UserRole = TutorRole;

export interface IEdge {
  src: string;
  edgeName: string;
  dst: string;
}

export interface GraphObject {
  id: ObjectId;
  object_type: ObjectType;
  [key: string]: ObjectFieldValue;
}

export type CounterModifier =
  | `+${string | number}`
  | `-${string | number}`
  | `=${string | number}`;

export interface UserIndexMapping {
  name: string;
  email: string;
  email_text: string;
  phone: string;
  phone_text: string;
  updated_at: string;
}

export interface NotificationIndexMapping {
  user: string;
  type: string;
  role: string;
  updated_at: string;
}

export interface AcademicYearIndexMapping {
  name: string;
  space: string;
  updated_at: string;
}

export interface BillableItemIndexMapping {
  name: string;
  academic_year: string;
  type: string;
  has_no_date: boolean;
  price: number;
  min_date: string;
  max_date: string;
  updated_at: string;
}

export interface BillableItemLogIndexMapping {
  student: string;
  billable_item: string;
  amount: number;
  fully_paid_at: string;
  updated_at: string;
}

export interface ExamGradeGroupTemplateIndexMapping {
  name: string;
  space: string;
  updated_at: string;
}

export interface ExamIndexMapping {
  name: string;
  space: string;
  academic_year: string;
  has_no_date: boolean;
  min_date: string;
  max_date: string;
  updated_at: string;
}

export interface ExamLogIndexMapping {
  student: string;
  exam: string;
  degree: number;
  attended: boolean;
  updated_at: string;
}

export interface StudentRoleIndexMapping {
  name: string;
  academic_year: string;
  study_group: string;
  student_phones: string;
  parent_phones: string;
  phone_text: string;
  updated_at: string;
}

export interface StudyGroupIndexMapping {
  name: string;
  space: string;
  academic_year: string;
  updated_at: string;
}

export interface TutorRoleIndexMapping {
  space: string;
  updated_at: string;
}

export type ValueSet =
  | "BillableItemType"
  | "Color"
  | "ContactPointType"
  | "ContactPointUse"
  | "Day"
  | "NamePrefix"
  | "NotificationCriticalityLevel"
  | "NotificationType"
  | "PaymentMethodType"
  | "UserGender"
  | "UserStatus";

export type BillableItemTypeVS =
  | "subscription"
  | "book"
  | "papers"
  | "revision"
  | "course"
  | "added-class"
  | "other";

export type ColorVS =
  | "red"
  | "green"
  | "blue"
  | "teal"
  | "gray"
  | "orange"
  | "yellow"
  | "cyan"
  | "purple"
  | "pink";

export type ContactPointTypeVS = "phone" | "email" | "telegram";

export type ContactPointUseVS = "personal" | "parent";

export type DayVS = "sat" | "sun" | "mon" | "tue" | "wed" | "thu" | "fri";

export type NamePrefixVS =
  | "mister"
  | "monsieur"
  | "herr"
  | "dr"
  | "tt"
  | "prof";

export type NotificationCriticalityLevelVS = "critical" | "warning" | "info";

export type NotificationTypeVS =
  | "verify_email"
  | "verify_phone"
  | "complete_tutor_profile"
  | "tutor_get_started";

export type PaymentMethodTypeVS = "vodafone_cash";

export type UserGenderVS = "male" | "female" | "unknown";

export type UserStatusVS = "created";

export interface HumanName {
  prefix: NamePrefixVS;
  first_name: string;
  middle_name: string;
  last_name: string;
  locale: string;
}

export interface PaymentMethod {
  type: PaymentMethodTypeVS;
  value: string;
}

export interface ContactPoint {
  use: ContactPointUseVS;
  type: ContactPointTypeVS;
  value: string;
}

export interface StudyGroupTimeTable {
  class_of_week: number;
  day: DayVS;
  time_from: number;
  time_to: number;
}

export interface ExamTimeTable {
  date: string;
  time_from: number;
  time_to: number;
}

export interface ExamGradeGroup {
  grade_group_id: string;
  name: string;
  color: ColorVS;
  range_from: number;
  range_to: number;
}

export interface ExamGradeGroupStats {
  [key: string]: number;
}

export interface BillableItemTimeTable {
  date_from: string;
  date_to: string;
}

export interface User extends GraphObject {
  object_type: "user";
  created_at: string;
  updated_at: string;
  deleted_at: string;
  name: HumanName[];
  email: string;
  email_verified: boolean;
  phone: string;
  phone_verified: boolean;
  status: UserStatusVS;
  last_read_notification: string;
  system_user: string;
}

export interface Session extends GraphObject {
  object_type: "session";
  created_at: string;
  updated_at: string;
  deleted_at: string;
  token: string;
  user: string;
  roles: string[];
  expiresAt: string;
}

export interface SystemUser extends GraphObject {
  object_type: "system_user";
  created_at: string;
  updated_at: string;
  deleted_at: string;
  hash: string;
}

export interface Space extends GraphObject {
  object_type: "space";
  created_at: string;
  updated_at: string;
  deleted_at: string;
  name: string;
  owner: string;
}

export interface Notification extends GraphObject {
  object_type: "notification";
  created_at: string;
  updated_at: string;
  deleted_at: string;
  type: NotificationTypeVS;
  data: { [key: string]: ObjectFieldValue };
  icon: string;
  user: string;
  role: string;
  alert: boolean;
  level: NotificationCriticalityLevelVS;
}

export interface UserStatus extends GraphObject {
  object_type: "user_status";
  created_at: string;
  updated_at: string;
  deleted_at: string;
  status: UserStatusVS;
  set_at: string;
  set_by: string;
  user: string;
}

export interface TutorRole extends GraphObject {
  object_type: "tutor_role";
  created_at: string;
  updated_at: string;
  deleted_at: string;
  payment_methods: PaymentMethod[];
  user: string;
  last_read_notification: string;
  contacts: ContactPoint[];
  space: string;
}

export interface AcademicYear extends GraphObject {
  object_type: "academic_year";
  created_at: string;
  updated_at: string;
  deleted_at: string;
  name: string;
  space: string;
  stats: string;
}

export interface AcademicYearStats extends GraphObject {
  object_type: "academic_year_stats";
  created_at: string;
  updated_at: string;
  deleted_at: string;
  student_counter: number;
  academic_year: string;
}

export interface AcademicYearTrail extends GraphObject {
  object_type: "academic_year_trail";
  created_at: string;
  updated_at: string;
  deleted_at: string;
  delta: { [key: string]: ObjectFieldValue };
  academic_year: string;
  role: string;
}

export interface StudyGroup extends GraphObject {
  object_type: "study_group";
  created_at: string;
  updated_at: string;
  deleted_at: string;
  name: string;
  academic_year: string;
  time_table: StudyGroupTimeTable[];
  stats: string;
}

export interface StudyGroupStats extends GraphObject {
  object_type: "study_group_stats";
  created_at: string;
  updated_at: string;
  deleted_at: string;
  student_counter: number;
  study_group: string;
}

export interface StudyGroupTrail extends GraphObject {
  object_type: "study_group_trail";
  created_at: string;
  updated_at: string;
  deleted_at: string;
  delta: { [key: string]: ObjectFieldValue };
  study_group: string;
  role: string;
}

export interface Exam extends GraphObject {
  object_type: "exam";
  created_at: string;
  updated_at: string;
  deleted_at: string;
  name: string;
  academic_year: string;
  max_grade: number;
  time_table: ExamTimeTable[];
  grade_groups: ExamGradeGroup[];
  grade_group_counter: number;
  stats: string;
}

export interface ExamStats extends GraphObject {
  object_type: "exam_stats";
  created_at: string;
  updated_at: string;
  deleted_at: string;
  student_counter: number;
  examined_students: number;
  grade_group_counts: ExamGradeGroupStats;
  exam: string;
}

export interface ExamTrail extends GraphObject {
  object_type: "exam_trail";
  created_at: string;
  updated_at: string;
  deleted_at: string;
  delta: { [key: string]: ObjectFieldValue };
  exam: string;
  role: string;
}

export interface ExamGradeGroupTemplate extends GraphObject {
  object_type: "exam_grade_group_template";
  created_at: string;
  updated_at: string;
  deleted_at: string;
  name: string;
  grade_groups: ExamGradeGroup[];
  space: string;
}

export interface ExamLog extends GraphObject {
  object_type: "exam_log";
  created_at: string;
  updated_at: string;
  deleted_at: string;
  student: string;
  attended: boolean;
  degree: number;
  exam: string;
}

export interface ExamLogTrail extends GraphObject {
  object_type: "exam_log_trail";
  created_at: string;
  updated_at: string;
  deleted_at: string;
  delta: { [key: string]: ObjectFieldValue };
  exam_log: string;
  role: string;
}

export interface StudentRole extends GraphObject {
  object_type: "student_role";
  created_at: string;
  updated_at: string;
  deleted_at: string;
  name: HumanName[];
  academic_year: string;
  study_group: string;
  contacts: ContactPoint[];
  notes: string;
}

export interface StudentRoleTrail extends GraphObject {
  object_type: "student_role_trail";
  created_at: string;
  updated_at: string;
  deleted_at: string;
  delta: { [key: string]: ObjectFieldValue };
  student_role: string;
  role: string;
}

export interface BillableItem extends GraphObject {
  object_type: "billable_item";
  created_at: string;
  updated_at: string;
  deleted_at: string;
  name: string;
  academic_year: string;
  type: BillableItemTypeVS;
  price: number;
  time_table: BillableItemTimeTable[];
  stats: string;
}

export interface BillableItemTrail extends GraphObject {
  object_type: "billable_item_trail";
  created_at: string;
  updated_at: string;
  deleted_at: string;
  delta: { [key: string]: ObjectFieldValue };
  billable_item: string;
  role: string;
}

export interface BillableItemStats extends GraphObject {
  object_type: "billable_item_stats";
  created_at: string;
  updated_at: string;
  deleted_at: string;
  student_counter: number;
  paid_students: number;
  billable_item: string;
}

export interface BillableItemLog extends GraphObject {
  object_type: "billable_item_log";
  created_at: string;
  updated_at: string;
  deleted_at: string;
  student: string;
  amount: number;
  receipt_url: string;
  billable_item: string;
  fully_paid_at: string;
}

export interface BillableItemLogTrail extends GraphObject {
  object_type: "billable_item_log_trail";
  created_at: string;
  updated_at: string;
  deleted_at: string;
  delta: { [key: string]: ObjectFieldValue };
  billable_item_log: string;
  role: string;
}
