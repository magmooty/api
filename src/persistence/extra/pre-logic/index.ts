import * as user from "./triggers/user";
import { GraphObject, ObjectFieldValue } from "@/graph/objects/types";
import { Context } from "@/tracing";

export type PreLogicHandler = (
  ctx: Context,
  object: GraphObject,
  payload?: { [key: string]: ObjectFieldValue }
) => Promise<void>;

export default {
  "PATCH user": user.onPatch,
} as { [key: string]: PreLogicHandler };
