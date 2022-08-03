import objects from "@/graph/objects";
import { GraphObject, ObjectFieldValue, User } from "@/graph/objects/types";

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
  default?: ObjectFieldValue;
  objectTypes?: string[];
  valueSet?: string;
  view?: string;
  struct?: string;
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
  cacheLevel: "external" | "none";
  deletedBy?: string[];
  views: { [key: string]: ObjectView };
  virtuals: { views: { [key: string]: ObjectViewVirtual } };
  fields: { [key: string]: ObjectField };
  edges: { [key: string]: ObjectEdge };
}

export { objects };
