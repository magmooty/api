export type ObjectId = string;

export type ObjectType =
  | "user"
  | "session"
  | "system-user"
  | "space"
  | "notification"
  | "user-status";

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
  | HumanName
  | PaymentMethod
  | ContactPoint
  | HumanName[]
  | PaymentMethod[]
  | ContactPoint[];

export type AppLocale = "ar" | "en";

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

export type ValueSet =
  | "ContactPointType"
  | "NamePrefix"
  | "NotificationCriticalityLevel"
  | "NotificationType"
  | "PaymentMethodType"
  | "UserGender"
  | "UserStatus";

export type ContactPointTypeVS = "phone" | "email" | "telegram";

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
  type: ContactPointTypeVS;
  value: string;
}

export interface User extends GraphObject {
  object_type: "user";
  name: HumanName[];
  email: string;
  email_verified: boolean;
  phone: string;
  phone_verified: boolean;
  gender: UserGenderVS;
  status: UserStatusVS;
  last_read_notification: string;
  system_user: string | GraphObject;
}

export interface Session extends GraphObject {
  object_type: "session";
  token: string;
  user: string | GraphObject;
  roles: string[];
  expiresAt: string;
}

export interface SystemUser extends GraphObject {
  object_type: "system-user";
  hash: string;
}

export interface Space extends GraphObject {
  object_type: "space";
  name: string;
  owner: string | GraphObject;
}

export interface Notification extends GraphObject {
  object_type: "notification";
  type: NotificationTypeVS;
  data: Object;
  user: string | GraphObject;
  alert: boolean;
  level: NotificationCriticalityLevelVS;
}

export interface UserStatus extends GraphObject {
  object_type: "user-status";
  status: UserStatusVS;
  set_at: string;
  set_by: string | GraphObject;
}
