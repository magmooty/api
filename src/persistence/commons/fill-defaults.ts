import { getObjectConfigFromObjectType } from "@/graph";
import { ObjectType, GraphObject } from "@/graph/objects/types";
import { Context } from "@/tracing";
import { serializeDate } from "./serialize-date";

export async function fillDefaults<T = GraphObject>(
  ctx: Context,
  objectType: ObjectType,
  data: T
): Promise<T> {
  const objectConfig = await getObjectConfigFromObjectType(ctx, objectType);

  const output: any = { ...data, created_at: serializeDate(new Date()) };

  for (const fieldName of Object.keys(objectConfig.fields)) {
    const fieldConfig = objectConfig.fields[fieldName];

    if (fieldConfig.default && !output[fieldName]) {
      output[fieldName] = fieldConfig.default(output as any);
    }
  }

  return output;
}
