import { getObjectConfigFromObjectType } from "@/graph";
import { ObjectType } from "@/graph/objects/types";
import { Context } from "@/tracing";
import kuuid from "kuuid";

export async function generateID(ctx: Context, objectType: ObjectType) {
  const { code } = await getObjectConfigFromObjectType(ctx, objectType);
  return `${kuuid.idms()}-${code}`;
}
