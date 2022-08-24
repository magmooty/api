export type ObjectId = string;

export type ObjectType = "user" | "session" | "system-user";

export type ObjectFieldValue =
  | string
  | string[]
  | number
  | number[]
  | boolean
  | Date
  | ObjectId
  | GraphObject;

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

export type ValueSet = "UserStatus";

export type UserStatusVS = "created";

export interface User extends GraphObject {
  object_type: "user";
  name: string;
  email: string;
  hash: string;
  email_verified: boolean;
  phone: string;
  phone_verified: boolean;
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
