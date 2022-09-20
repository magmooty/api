import { errors, wrapper } from "@/components";
import structs from "@/graph/structs";
import {
  GraphObject,
  ObjectFieldValue,
  ObjectType,
  User,
} from "@/graph/objects/types";
import { Context } from "@/tracing";
import ms from "milliseconds";

export type ObjectFieldType =
  | "json"
  | "string"
  | "number"
  | "boolean"
  | "date"
  | "object-id"
  | "struct"
  | "value-set"
  | "array:string"
  | "array:number"
  | "array:boolean"
  | "array:date"
  | "array:object-id"
  | "array:struct"
  | "array:value-set"
  | "counter";

export interface ObjectField {
  type: ObjectFieldType;
  default?: (object: GraphObject, author?: string) => ObjectFieldValue;
  objectTypes?: string[];
  valueSet?: string;
  view?: string;
  struct?: string;
  unique?: boolean;
  required?: boolean;
  schema?: string;
  stripDisallowed?: boolean;
}

export interface ObjectEdge {
  objectTypes?: string[];
  view?: string;
}

export interface ObjectView {
  GET: string[];
  POST: string[];
  PATCH: string[];
  DELETE?: string[];
}

export interface ObjectViewVirtualExecutorOptions {
  author: User;
  roles: string[];
  method: "POST" | "PATCH" | "GET" | "DELETE";
}

export type ObjectViewVirtualExecutor = (
  ctx: Context | null,
  object: GraphObject,
  options: ObjectViewVirtualExecutorOptions
) => Promise<boolean>;

export interface ObjectViewVirtual {
  pre: string[];
  execute: ObjectViewVirtualExecutor;
  disallowStrip?: boolean;
}

export enum ObjectTTL {
  Minimal = ms.minutes(10),
  Active = ms.days(3),
}

export interface StructConfigFields {
  [key: string]: ObjectField;
}

export interface StructConfig {
  fields: StructConfigFields;
}

export interface ObjectConfig extends StructConfig {
  code: string;
  systemObject?: boolean;
  cacheLevel: "external" | "none" | "onlyCache";
  ttl?: ObjectTTL;
  deletedBy?: string[];
  views: { _default: ObjectView; [key: string]: ObjectView };
  virtuals: { views: { [key: string]: ObjectViewVirtual } };
  edges: { [key: string]: ObjectEdge };
  counterFields?: string[];
  counterStructs?: string[];
}

import objects from "@/graph/objects";

const objectCodeObjectTypeMap: { [key: string]: string } = Object.keys(
  objects
).reduce(
  (p, c) => ({
    ...p,
    [objects[c as ObjectType].code]: c,
  }),
  {}
);

const extractCounterFields = async (
  ctx: Context,
  structConfig: StructConfig
): Promise<{ counterFields: string[]; counterStructs: string[] }> => {
  const counterFields = Object.keys(structConfig.fields).filter(
    (fieldName) => structConfig.fields[fieldName].type === "counter"
  );

  const structFields = Object.keys(structConfig.fields).filter(
    (fieldName) => structConfig.fields[fieldName].type === "struct"
  );

  let structCounterFields: string[] = [];
  let structCounterStructs: string[] = [];

  for (const structField of structFields) {
    const nestedStructConfig = await getStructConfig(
      ctx,
      structConfig.fields[structField].struct as string
    );

    const { counterFields: nestedStructCounterFields, counterStructs } =
      await extractCounterFields(ctx, nestedStructConfig);

    if (nestedStructConfig.fields._any) {
      structCounterStructs = [...structCounterStructs, structField];
    }

    structCounterFields = [
      ...structCounterFields,
      ...nestedStructCounterFields.map(
        (fieldName) => `${structField}.${fieldName}`
      ),
    ];
  }

  return {
    counterFields: [...counterFields, ...structCounterFields],
    counterStructs: [...structCounterStructs],
  };
};

export const initGraph = wrapper(
  { name: "initGraph", file: __filename },
  async (ctx: Context) => {
    await Promise.all(
      Object.keys(objects).map(async (objectType) => {
        // Counter fields and counter structs
        const objectConfig = await getObjectConfigFromObjectType(
          ctx,
          objectType as ObjectType
        );

        const { counterFields, counterStructs } = await extractCounterFields(
          ctx,
          objectConfig
        );

        objects[objectType].counterFields = counterFields;
        objects[objectType].counterStructs = counterStructs;

        // Auto-fill delete in views
        Object.keys(objectConfig.views).forEach((viewName) => {
          if (!objectConfig.views[viewName].DELETE) {
            objectConfig.views[viewName].DELETE = objectConfig.deletedBy || [];
          }
        });
      })
    );
  }
);

export const checkIfObjectTypeExists = async (
  ctx: Context,
  objectType: ObjectType
): Promise<boolean> => {
  const objectConfig = objects[objectType];

  if (!objectConfig) {
    return errors.createError(ctx, "ObjectTypeDoesNotExist", { objectType });
  }

  return true;
};

export const getStructConfigFromObjectTypeOrStructName = async (
  ctx: Context,
  name: string
): Promise<StructConfig> => {
  const objectConfig = objects[name as ObjectType];

  if (objectConfig) {
    return objectConfig;
  }
  const structConfig = structs[name];

  if (structConfig) {
    return structConfig;
  }

  if (!objectConfig && !structConfig) {
    errors.createError(ctx, "StructDoesNotExist", { name });
  }

  return null as any;
};

export const getStructConfig = async (ctx: Context, structName: string) => {
  const structConfig = structs[structName];

  if (!structConfig) {
    return errors.createError(ctx, "StructDoesNotExist", { structName });
  }

  return structConfig;
};

export const getObjectConfigFromObjectType = async (
  ctx: Context,
  objectType: ObjectType
): Promise<ObjectConfig> => {
  const objectConfig = objects[objectType];

  if (!objectConfig) {
    return errors.createError(ctx, "ObjectTypeDoesNotExist", { objectType });
  }

  return objectConfig;
};

export const getObjectTypeFromId = async (
  ctx: Context,
  id: string
): Promise<ObjectType> => {
  // 39 is the number of characters of a kuuid + the object code suffix
  if (!id || id.length !== 35) {
    return errors.createError(ctx, "InvalidObjectId", { id });
  }

  const objectCode = id.slice(id.length - 2);

  const objectType = objectCodeObjectTypeMap[objectCode] as ObjectType;

  if (!objectType) {
    return errors.createError(ctx, "ObjectTypeDoesNotExist", { id });
  }

  return objectType;
};

export { objects };
