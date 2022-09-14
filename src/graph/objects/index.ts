import { ObjectConfig } from "..";
import notification from "./notification";
import session from "./session";
import space from "./space";
import systemUser from "./system-user";
import tutorRole from "./tutor-role";
import user from "./user";
import userStatus from "./user-status";

export default {
  user,
  session,
  system_user: systemUser,
  space,
  notification,
  user_status: userStatus,
  tutor_role: tutorRole,
} as { [key: string]: ObjectConfig };
