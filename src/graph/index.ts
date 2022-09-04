import { errors } from "@/components";
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
  | "array:value-set";

export interface ObjectField {
  type: ObjectFieldType;
  default?: (object: GraphObject, author?: User) => ObjectFieldValue;
  objectTypes?: string[];
  valueSet?: string;
  view?: string;
  struct?: string;
  unique?: boolean;
  required?: boolean;
  schema?: string;
}

export interface ObjectEdge {
  objectTypes?: string[];
}

export interface ObjectView {
  GET: string[];
  POST: string[];
  PATCH: string[];
}

export type ObjectViewVirtualExecutor = (
  object: GraphObject,
  author: User
) => Promise<boolean>;

export interface ObjectViewVirtual {
  pre: string[];
  execute: ObjectViewVirtualExecutor;
}

export enum ObjectTTL {
  Minimal = ms.minutes(10),
  Active = ms.days(3),
}

export interface StructConfig {
  fields: {
    [key: string]: ObjectField;
  };
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
  // 39 is the number of characters of a uuid + the object code suffix
  if (!id || id.length !== 39) {
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
