import * as session from "./session";
import { GraphObject } from "@/graph/objects/types";
import { Context } from "@/tracing";

export type CacheHijackHandler = (
  ctx: Context,
  object: GraphObject
) => Promise<void>;

export default {
  "POST session": session.onPost,
} as { [key: string]: CacheHijackHandler };
