import { getObjectConfigFromObjectType } from "@/graph";
import { ObjectType, GraphObject } from "@/graph/objects/types";
import { Context } from "@/tracing";

export async function fillDefaults<T = GraphObject>(
  ctx: Context,
  objectType: ObjectType,
  data: T
): Promise<T> {
  const objectConfig = await getObjectConfigFromObjectType(ctx, objectType);

  const output: any = { ...data };

  for (const fieldName of Object.keys(objectConfig.fields)) {
    const fieldConfig = objectConfig.fields[fieldName];

    if (fieldConfig.default && !output[fieldName]) {
      output[fieldName] = fieldConfig.default(data as any);
    }
  }

  return output;
}
