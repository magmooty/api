import { errors } from "@/components";
import objects from "@/graph/objects";
import {
  GraphObject,
  ObjectFieldValue,
  ObjectType,
  User,
} from "@/graph/objects/types";
import { Context } from "@/tracing";

export type ObjectFieldType =
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
  default?: (object: GraphObject) => ObjectFieldValue;
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
) => boolean;

export interface ObjectViewVirtual {
  pre: string[];
  execute: ObjectViewVirtualExecutor;
}

export interface ObjectConfig {
  code: string;
  cacheLevel: "external" | "none" | "onlyCache";
  deletedBy?: string[];
  views: { [key: string]: ObjectView };
  virtuals: { views: { [key: string]: ObjectViewVirtual } };
  fields: { [key: string]: ObjectField };
  edges: { [key: string]: ObjectEdge };
}

const objectCodeObjectTypeMap: { [key: string]: string } = Object.keys(
  objects
).reduce(
  (p, c) => ({
    ...p,
    [objects[c as ObjectType].code]: c,
  }),
  {}
);

export const getObjectConfigFromObjectType = async (
  ctx: Context,
  objectType: ObjectType
): Promise<ObjectConfig> => {
  return objects[objectType];
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
