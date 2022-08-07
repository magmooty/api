import {
  GraphObject,
  ObjectFieldValue,
  ObjectId,
  ObjectType,
} from "@/graph/objects/types";
import { Context } from "@/tracing";
import { DynamoDBConfig, DynamoPersistenceDriver } from "./dynamodb";

export interface CreateObjectPayload {
  object_type: ObjectType;
  [key: string]: ObjectFieldValue;
}

export interface Unique {
  id: string;
  object_id: string;
}

export interface Lookup {
  code: string;
  value: string;
}

export interface MethodOptions {
  noLocks?: boolean;
}

export type SeedObjectsAfterKey = `${string}#${ObjectId}`;

export interface SeedObjectsResult<T> {
  results: T[];
  nextKey?: SeedObjectsAfterKey | null;
}

export type CounterModifier = `+${number}` | `-${number}` | number;

export interface PersistenceDriver {
  /* */
  init(): Promise<void>;

  /* Locks */

  getLock?(ctx: Context, key: string): Promise<string>;

  freeLock?(ctx: Context, key: string, lockHolder: string): Promise<void>;

  // /* Objects */

  createObject<T = GraphObject>(
    ctx: Context | null,
    object: CreateObjectPayload
  ): Promise<T>;

  getObject<T = GraphObject>(ctx: Context | null, id: string): Promise<T>;

  updateObject<T = GraphObject>(
    ctx: Context | null,
    id: string,
    object: { [key: string]: ObjectFieldValue }
  ): Promise<T>;

  replaceObject<T = GraphObject>(
    ctx: Context | null,
    id: string,
    object: Partial<GraphObject>
  ): Promise<T>;

  deleteObject(ctx: Context | null, id: string): Promise<void>;

  queryObjects<T = GraphObject>(
    ctx: Context | null,
    objectType: ObjectType,
    projection?: string[] | null,
    after?: SeedObjectsAfterKey | null
  ): Promise<SeedObjectsResult<T>>;

  // /* Counters */

  // getCounter(ctx: Context, id: string, fieldName: string): Promise<number>;

  // setCounter(
  //   ctx: Context,
  //   id: string,
  //   fieldName: string,
  //   value: CounterModifier
  // ): Promise<void>;

  // /* Uniques */

  // addUnique(ctx: Context, value: Unique): Promise<void>;

  // removeUnique(ctx: Context, id: string): Promise<void>;

  // checkUnique(ctx: Context, id: string): Promise<Unique>;

  // /* Lookups */

  // getLookupItem(ctx: Context, code: string): Promise<Lookup>;

  // createLookupItem(ctx: Context, code: string, value: string): Promise<void>;

  // deleteLookupItem(ctx: Context, code: string): Promise<void>;

  // /* Edges */

  // createEdge(
  //   ctx: Context,
  //   src: string,
  //   edgeName: string,
  //   dst: string,
  //   sortValue?: string
  // ): Promise<void>;

  // deleteEdge(
  //   ctx: Context,
  //   src: string,
  //   edgeName: string,
  //   dst: string,
  //   sortValue?: string
  // ): Promise<void>;

  // getAllEdges(ctx: Context, src: string, edgeName: string): Promise<string[]>;

  // getAllReverseEdges(
  //   ctx: Context,
  //   edgeName: string,
  //   dst: string
  // ): Promise<string[]>;

  // getEdgeCount(ctx: Context, src: string, edgeName: string): Promise<number>;

  // getReverseEdgeCount(
  //   ctx: Context,
  //   dst: string,
  //   edgeName: string
  // ): Promise<number>;
}

export interface PersistenceConfig {
  driver: "dynamodb";
  config: DynamoDBConfig;
  cache: {
    driver: "redis";
    config: {
      host: string;
      port: number;
      prefix: string;
    };
  };
}

export function createPersistenceDriver({
  driver,
  config,
}: PersistenceConfig): PersistenceDriver {
  switch (driver) {
    case "dynamodb":
      return new DynamoPersistenceDriver(config);
    default:
      throw new Error(
        "Couldn't create persistence driver for driver with current config"
      );
  }
}
