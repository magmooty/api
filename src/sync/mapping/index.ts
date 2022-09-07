import user from "./user";
import notification from "./notification";

export const mappings = { user, notification };

export const indexNames = Object.keys(mappings);

export type IndexName = keyof typeof mappings;
