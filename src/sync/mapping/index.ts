import user from "./user";
import notification from "./notification";

export const mappings = { user, notification };

export type IndexName = keyof typeof mappings;
