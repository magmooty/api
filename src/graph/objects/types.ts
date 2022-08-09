export type ObjectId = string;

export type ObjectType = "user";

export type ObjectFieldValue = string | number | boolean | Date | ObjectId;

export type AppLocale = "ar" | "en";

export interface GraphObject {
  id: ObjectId;
  object_type: ObjectType;
  [key: string]: ObjectFieldValue;
}

export type ValueSet = "UserStatus";
export type UserStatusVS = "created";

export interface User {
  id: ObjectId;
  object_type: "user";
  email: string;
  hash: string;
  email_verified: boolean;
  status: UserStatusVS;
  last_read_notification: string;
}
