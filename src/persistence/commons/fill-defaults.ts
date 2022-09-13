import { getObjectConfigFromObjectType } from "@/graph";
import { ObjectType, GraphObject, User } from "@/graph/objects/types";
import { Context } from "@/tracing";
import { serializeDate } from "./serialize-date";

export async function fillDefaults<T = GraphObject>(
  ctx: Context,
  objectType: ObjectType,
  data: T,
  { author }: { author?: User } = {}
): Promise<T> {
  const objectConfig = await getObjectConfigFromObjectType(ctx, objectType);

  const created_at = serializeDate(new Date());

  const output: any = { ...data, created_at, updated_at: created_at };

  for (const fieldName of Object.keys(objectConfig.fields)) {
    const fieldConfig = objectConfig.fields[fieldName];

    if (fieldConfig.default && !output[fieldName]) {
      const defaultValue = fieldConfig.default(output as any, author);

      if (defaultValue !== undefined) {
        output[fieldName] = defaultValue;
      }
    }
  }

  return output;
}
