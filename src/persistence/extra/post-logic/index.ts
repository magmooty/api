import { GraphObject, ObjectFieldValue } from "@/graph/objects/types";
import { Context } from "@/tracing";
import * as examStats from "./triggers/exam_stats";

export type PostLogicPayload = { [key: string]: ObjectFieldValue };

export type PostLogicHandler = (
  ctx: Context,
  object: GraphObject | any,
  payload?: PostLogicPayload
) => Promise<void>;

export default {
  "GET exam_stats": examStats.onGet,
  "POST exam_stats": examStats.onPost,
  "PATCH exam_stats": examStats.onPatch,
} as { [key: string]: PostLogicHandler };
