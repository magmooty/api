import { getObjectConfigFromObjectType } from "@/graph";
import { ObjectType } from "@/graph/objects/types";
import { Context } from "@/tracing";
import { v4 as uuid } from "uuid";

export async function generateID(ctx: Context, objectType: ObjectType) {
  const { code } = await getObjectConfigFromObjectType(ctx, objectType);
  return `${uuid()}-${code}`;
}
