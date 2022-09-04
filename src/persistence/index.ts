import { CacheConfig, CacheDriver } from "@/cache";
import { RedisCacheDriver } from "@/cache/redis";
import { queue, wrapper } from "@/components";
import { getObjectConfigFromObjectType, getObjectTypeFromId } from "@/graph";
import {
  GraphObject,
  ObjectFieldValue,
  ObjectId,
  ObjectType,
  User,
} from "@/graph/objects/types";
import { Context } from "@/tracing";
import { randomBytes } from "crypto";
import { fillDefaults } from "./commons/fill-defaults";
import { generateID } from "./commons/generate-id";
import { serializeDate } from "./commons/serialize-date";
import { dryValidation, uniqueValidation } from "./commons/validate-fields";
import { wait } from "./commons/wait";
import { DynamoDBConfig, DynamoPersistenceDriver } from "./dynamodb";
import cacheHijackRules from "./extra/cache-hijack";
import preLogicRules from "./extra/pre-logic";

/**
 * Prefix a cache key with the lock prefix
 * @param {string} key The key to obtain a lock for
 * @returns {string} Prefixed key
 */
function generateLockKey(key: string): string {
  return `lock_${key}`;
}

/**
 * Get a stream of random characters to hold a lock with
 * @returns {string} Random string of 40 characters (20 bytes in hex)
 */
function generateLockHolder(): string {
  return randomBytes(20).toString("hex");
}

export interface CreateObjectPayload {
  object_type: ObjectType;
  [key: string]: ObjectFieldValue;
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

  getLock?(ctx: Context | null, key: string): Promise<string>;

  freeLock?(
    ctx: Context | null,
    key: string,
    lockHolder: string
  ): Promise<void>;

  // /* Objects */

  createObject<T = GraphObject>(
    ctx: Context | null,
    id: string,
    object: CreateObjectPayload
  ): Promise<T>;

  getObject<T = GraphObject>(ctx: Context | null, id: string): Promise<T>;

  updateObject<T = GraphObject>(
    ctx: Context | null,
    id: string,
    object: Partial<T>
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
    after?: SeedObjectsAfterKey | string | null
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

  addUnique(
    ctx: Context | null,
    objectType: ObjectType,
    fieldName: string,
    value: string | number
  ): Promise<void>;

  removeUnique(
    ctx: Context | null,
    objectType: ObjectType,
    fieldName: string,
    value: string | number
  ): Promise<void>;

  /**
   * Returns true if the value is unique and can be created
   */
  checkUnique(
    ctx: Context | null,
    objectType: ObjectType,
    fieldName: string,
    value: string | number
  ): Promise<boolean>;

  // /* Lookups */

  // getLookupItem(ctx: Context, code: string): Promise<Lookup>;

  // createLookupItem(ctx: Context, code: string, value: string): Promise<void>;

  // deleteLookupItem(ctx: Context, code: string): Promise<void>;

  // /* Edges */

  createEdge(
    ctx: Context | null,
    src: ObjectId,
    edgeName: string,
    dst: ObjectId
  ): Promise<void>;

  deleteEdge(
    ctx: Context | null,
    src: string,
    edgeName: string,
    dst: string
  ): Promise<void>;

  getEdges(
    ctx: Context | null,
    src: string,
    edgeName: string
  ): Promise<string[]>;

  getReverseEdges(
    ctx: Context | null,
    edgeName: string,
    dst: string
  ): Promise<string[]>;

  quit(): Promise<void>;
}

export interface PersistenceConfig {
  driver: "dynamodb";
  config: DynamoDBConfig;
  constants: {
    lockTimeout: number;
    lockObtainerTimeout: number;
    lockAttemptInterval: number;
    lookupsTTL: number;
  };
  cache: CacheConfig;
}

export type PreUpdateObjectHook = (
  previous: GraphObject,
  updatePayload: { [key: string]: ObjectFieldValue }
) => Promise<void>;

export interface UpdateObjectHooks {
  pre?: PreUpdateObjectHook;
}

export type PreCreateObjectHook = (object: GraphObject) => Promise<void>;

export interface CreateObjectHooks {
  pre?: PreCreateObjectHook;
}

export class Persistence {
  public primaryDB: PersistenceDriver;
  public cache: CacheDriver;

  constructor(private persistenceConfig: PersistenceConfig) {
    switch (persistenceConfig.driver) {
      case "dynamodb":
        this.primaryDB = new DynamoPersistenceDriver(persistenceConfig.config);
        break;
      default:
        throw new Error(
          "Couldn't create database driver for persistence with current config"
        );
    }

    switch (persistenceConfig.cache.driver) {
      case "redis":
        this.cache = new RedisCacheDriver(persistenceConfig.cache.config);
        break;
      default:
        throw new Error(
          "Couldn't create cache driver for persistence with current config"
        );
    }
  }

  init = wrapper({ name: "init", file: __filename }, async () => {
    await this.primaryDB.init();
    await this.cache.init();
  });

  getLock = wrapper(
    { name: "getLock", file: __filename },
    async (ctx: Context, key: string): Promise<string> => {
      const prefixedKey = generateLockKey(key);
      const lockHolder = generateLockHolder();

      ctx.log.info("Trying to obtain a lock for key", { key, lockHolder });

      let retries = 0;

      while (true) {
        const lockObtained = await this.cache.set(
          ctx,
          prefixedKey,
          lockHolder,
          this.persistenceConfig.constants.lockTimeout,
          true
        );

        if (lockObtained) {
          ctx.log.info("Obtained a lock for key", { key, lockHolder });
          return lockHolder;
        }

        if (
          retries * this.persistenceConfig.constants.lockAttemptInterval >=
          this.persistenceConfig.constants.lockObtainerTimeout
        ) {
          ctx.log.warn("Failed to obtain a lock for key", {
            key,
            retries,
            lockHolder,
            prefixedKey,
          });
          throw new Error(`Failed to obtain a lock for key: ${key}`);
        }

        ctx.log.warn("Retrying to obtain a lock for key", {
          key,
          lockHolder,
        });
        retries++;
        await wait(this.persistenceConfig.constants.lockAttemptInterval);
      }
    }
  );

  freeLock = wrapper(
    { name: "freeLock", file: __filename },
    async (ctx: Context, key: string, lockHolder: string): Promise<void> => {
      const prefixedKey = generateLockKey(key);

      ctx.register({ key, prefixedKey, lockHolder });

      const existingLockHolder = await this.cache.get(ctx, prefixedKey, true);

      if (!existingLockHolder) {
        ctx.log.info("Lock is already free");
        return;
      }

      if (existingLockHolder === lockHolder) {
        await this.cache.del(ctx, prefixedKey);
        ctx.log.info("Lock freed", { lockHolder });
        return;
      }

      ctx.log.info("Resource has been locked by another process", {
        existingLockHolder,
      });
    }
  );

  getObject = wrapper(
    { name: "getObject", file: __filename },
    async <T = GraphObject>(ctx: Context, id: string): Promise<T> => {
      ctx.startTrackTime(
        "persistence_get_object_duration",
        "persistence_get_object_error_duration"
      );

      ctx.register({
        id,
      });

      const objectType = await getObjectTypeFromId(ctx, id);

      const objectConfig = await getObjectConfigFromObjectType(ctx, objectType);

      ctx.setParam("objectType", objectType);

      ctx.setErrorDurationMetricLabels({ objectType });

      let object;

      switch (objectConfig.cacheLevel) {
        case "external":
        case "onlyCache":
          object = await this.cache.get(ctx, id);
          break;
      }

      if (!object) {
        object = await this.primaryDB.getObject<T>(ctx, id);
      }

      ctx.setDurationMetricLabels({ objectType });

      return object as T;
    },
    (ctx, error) => {
      ctx.metrics
        .getCounter("persistence_get_object_error")
        .inc({ objectType: ctx.getParam("objectType"), error: error.message });
    },
    (ctx) => {
      ctx.metrics
        .getCounter("persistence_get_object")
        .inc({ objectType: ctx.getParam("objectType") });
    }
  );

  createObject = wrapper(
    { name: "createObject", file: __filename },
    async <T = GraphObject>(
      ctx: Context,
      payload: CreateObjectPayload,
      { hooks, author }: { hooks?: CreateObjectHooks; author?: User } = {}
    ): Promise<T> => {
      ctx.startTrackTime(
        "persistence_create_object_duration",
        "persistence_create_object_error_duration"
      );

      ctx.register({ payload });

      const { object_type: objectType } = payload;

      const path = `POST ${objectType}`;
      const objectConfig = await getObjectConfigFromObjectType(ctx, objectType);

      ctx.setParam("objectType", objectType);

      ctx.setErrorDurationMetricLabels({ objectType });

      let object = (await fillDefaults(ctx, objectType, payload, {
        author,
      })) as GraphObject;

      await dryValidation(ctx, objectType, object as any, false);

      const id = await generateID(ctx, objectType);

      object = { ...object, id };

      if (preLogicRules[path]) {
        await preLogicRules[path](ctx, object);
      }

      if (hooks && hooks.pre) {
        await hooks.pre(object);
      }

      // Recompute after hooks
      object = { ...object, id, object_type: objectType };

      await uniqueValidation(
        ctx,
        objectType,
        null,
        object,
        this.primaryDB,
        "create"
      );

      switch (objectConfig.cacheLevel) {
        case "external":
        case "onlyCache":
          if (cacheHijackRules[path]) {
            await cacheHijackRules[path](ctx, object);
          } else {
            await this.cache.set(ctx, id, object);
          }
          break;
      }

      if (objectConfig.cacheLevel !== "onlyCache") {
        await this.primaryDB.createObject(ctx, id, object);
      }

      await queue.send(ctx, {
        method: "POST",
        path: objectType,
        type: "object",
        current: object,
        author: author?.id,
      });

      return object as any;
    },
    (ctx, error) => {
      ctx.metrics
        .getCounter("persistence_create_object_error")
        .inc({ objectType: ctx.getParam("objectType"), error: error.message });
    },
    (ctx) => {
      ctx.metrics
        .getCounter("persistence_create_object")
        .inc({ objectType: ctx.getParam("objectType") });
    }
  );

  updateObject = wrapper(
    { name: "updateObject", file: __filename },
    async <T = GraphObject>(
      ctx: Context,
      id: string,
      payload: Partial<T>,
      { hooks, author }: { hooks?: UpdateObjectHooks; author?: User } = {}
    ): Promise<T> => {
      ctx.startTrackTime(
        "persistence_update_object_duration",
        "persistence_update_object_error_duration"
      );

      ctx.register({
        id,
        payload,
      });

      const objectType = await getObjectTypeFromId(ctx, id);
      const objectConfig = await getObjectConfigFromObjectType(ctx, objectType);

      const path = `PATCH ${objectType}`;

      ctx.setParam("objectType", objectType);

      ctx.setErrorDurationMetricLabels({ objectType });

      await dryValidation(ctx, objectType, payload as any, true);

      const lockHolder = await this.getLock(ctx, id);

      ctx.setParam("lockKey", id);
      ctx.setParam("lockHolder", lockHolder);

      const previous = await this.getObject<GraphObject>(ctx, id);

      const updatePayload = {
        ...payload,
        updated_at: serializeDate(new Date()),
      };

      if (preLogicRules[path]) {
        await preLogicRules[path](ctx, previous, updatePayload);
      }

      if (hooks && hooks.pre) {
        await hooks.pre(previous, updatePayload);
      }

      // Recompute after pre-logic rules and pre-hooks
      const updatedObject = {
        ...previous,
        ...updatePayload,
        id,
        object_type: objectType,
      };

      await uniqueValidation(
        ctx,
        objectType,
        previous,
        payload as Partial<GraphObject>,
        this.primaryDB,
        "update"
      );

      switch (objectConfig.cacheLevel) {
        case "external":
        case "onlyCache":
          await this.cache.set(ctx, id, updatedObject);
          break;
      }

      if (objectConfig.cacheLevel !== "onlyCache") {
        await this.primaryDB.updateObject(ctx, id, updatePayload);
      }

      await this.freeLock(ctx, id, lockHolder);

      await queue.send(ctx, {
        method: "PATCH",
        path: objectType,
        type: "object",
        previous,
        current: updatedObject as any,
        author: author?.id,
      });

      ctx.setDurationMetricLabels({ objectType });

      return updatedObject as any;
    },
    async (ctx, error) => {
      {
        ctx.metrics.getCounter("persistence_update_object_error").inc({
          objectType: ctx.getParam("objectType"),
          error: error.message,
        });

        const lockKey = ctx.getParam("lockKey");
        const lockHolder = ctx.getParam("lockHolder");

        await this.freeLock(ctx, lockKey, lockHolder);
      }
    },
    (ctx) => {
      ctx.metrics
        .getCounter("persistence_update_object")
        .inc({ objectType: ctx.getParam("objectType") });
    }
  );

  replaceObject = wrapper(
    { name: "replaceObject", file: __filename },
    async <T = GraphObject>(
      ctx: Context,
      id: string,
      payload: Partial<GraphObject>
    ): Promise<T> => {
      ctx.startTrackTime(
        "persistence_replace_object_duration",
        "persistence_replace_object_error_duration"
      );

      ctx.register({ id, payload });

      const objectType = await getObjectTypeFromId(ctx, id);
      const objectConfig = await getObjectConfigFromObjectType(ctx, objectType);

      ctx.setParam("objectType", objectType);

      ctx.setErrorDurationMetricLabels({ objectType });

      await dryValidation(ctx, objectType, payload as any, true);

      const lockHolder = await this.getLock(ctx, id);

      ctx.setParam("lockKey", id);
      ctx.setParam("lockHolder", lockHolder);

      const previous = await this.getObject<GraphObject>(ctx, id);

      await uniqueValidation(
        ctx,
        objectType,
        previous,
        payload as GraphObject,
        this.primaryDB,
        "update"
      );

      const replacedObject = {
        ...payload,
        id,
        object_type: objectType,
        updated_at: serializeDate(new Date()),
      };

      switch (objectConfig.cacheLevel) {
        case "external":
        case "onlyCache":
          await this.cache.set(ctx, id, replacedObject);
          break;
      }

      await this.primaryDB.replaceObject(ctx, id, replacedObject);

      await this.freeLock(ctx, id, lockHolder);

      await queue.send(ctx, {
        method: "PATCH",
        path: objectType,
        type: "object",
        previous,
        current: replacedObject,
      });

      ctx.setDurationMetricLabels({ objectType });

      return replacedObject as any;
    },
    async (ctx, error) => {
      {
        ctx.metrics.getCounter("persistence_replace_object_error").inc({
          objectType: ctx.getParam("objectType"),
          error: error.message,
        });

        const lockKey = ctx.getParam("lockKey");
        const lockHolder = ctx.getParam("lockHolder");

        await this.freeLock(ctx, lockKey, lockHolder);
      }
    },
    (ctx) => {
      ctx.metrics
        .getCounter("persistence_replace_object")
        .inc({ objectType: ctx.getParam("objectType") });
    }
  );

  deleteObject = wrapper(
    { name: "deleteObject", file: __filename },
    async (ctx: Context, id: string): Promise<GraphObject> => {
      ctx.startTrackTime(
        "persistence_delete_object_duration",
        "persistence_delete_object_error_duration"
      );

      ctx.register({
        id,
      });

      const objectType = await getObjectTypeFromId(ctx, id);
      const objectConfig = await getObjectConfigFromObjectType(ctx, objectType);

      ctx.setParam("objectType", objectType);

      ctx.setErrorDurationMetricLabels({ objectType });

      const lockHolder = await this.getLock(ctx, id);

      ctx.setParam("lockKey", id);
      ctx.setParam("lockHolder", lockHolder);

      const previous = await this.getObject<GraphObject>(ctx, id);

      await uniqueValidation(
        ctx,
        objectType,
        previous,
        null,
        this.primaryDB,
        "delete"
      );

      const deleteUpdatePayload = {
        deleted_at: serializeDate(new Date()),
      };

      const deletedObject = {
        ...previous,
        ...deleteUpdatePayload,
        id,
        object_type: objectType,
      };

      switch (objectConfig.cacheLevel) {
        case "external":
        case "onlyCache":
          await this.cache.set(ctx, id, deletedObject);
          break;
      }

      const current = await this.primaryDB.updateObject(
        ctx,
        id,
        deleteUpdatePayload
      );

      await this.freeLock(ctx, id, lockHolder);

      await queue.send(ctx, {
        method: "DELETE",
        path: objectType,
        type: "object",
        previous,
        current: current as any,
      });

      ctx.setDurationMetricLabels({ objectType });

      return deletedObject;
    },
    async (ctx, error) => {
      {
        ctx.metrics.getCounter("persistence_delete_object_error").inc({
          objectType: ctx.getParam("objectType"),
          error: error.message,
        });

        const lockKey = ctx.getParam("lockKey");
        const lockHolder = ctx.getParam("lockHolder");

        await this.freeLock(ctx, lockKey, lockHolder);
      }
    },
    (ctx) => {
      ctx.metrics
        .getCounter("persistence_delete_object")
        .inc({ objectType: ctx.getParam("objectType") });
    }
  );

  createEdge = wrapper(
    { name: "createEdge", file: __filename },
    async (
      ctx: Context,
      src: ObjectId,
      edgeName: string,
      dst: ObjectId
    ): Promise<void> => {
      ctx.startTrackTime(
        "persistence_create_edge_duration",
        "persistence_create_edge_error_duration"
      );

      const srcObjectType = await getObjectTypeFromId(ctx, src);

      ctx.register({ src, edgeName, dst });

      ctx.setParam("srcObjectType", srcObjectType);
      ctx.setParam("edgeName", edgeName);

      ctx.setErrorDurationMetricLabels({ srcObjectType, edgeName });

      const lockKey = `${src}-${edgeName}-${dst}`;
      const cacheKey = `e_${src}-${edgeName}`;

      const lockHolder = await this.getLock(ctx, lockKey);

      ctx.setParam("lockKey", lockKey);
      ctx.setParam("lockHolder", lockHolder);

      const position = await this.cache.lpos(ctx, cacheKey, dst);

      if (position >= 0) {
        return;
      }

      const existingEdgesList = await this.primaryDB.getEdges(
        ctx,
        src,
        edgeName
      );

      if (existingEdgesList.includes(dst)) {
        return;
      }

      const isCacheKeyExistingInCache = await this.cache.exists(ctx, cacheKey);

      // Populate
      if (isCacheKeyExistingInCache) {
        await this.cache.lpush(ctx, cacheKey, [dst]);
      } else {
        await this.cache.lpush(ctx, cacheKey, [...existingEdgesList, dst]);
      }

      await this.primaryDB.createEdge(ctx, src, edgeName, dst);

      await this.freeLock(ctx, lockKey, lockHolder);

      await queue.send(ctx, {
        method: "POST",
        path: `${srcObjectType}/${edgeName}`,
        type: "object",
        current: {
          src,
          edgeName,
          dst,
        },
      });

      ctx.setDurationMetricLabels({ srcObjectType });
    },
    async (ctx, error) => {
      ctx.metrics.getCounter("persistence_create_edge_error").inc({
        srcObjectType: ctx.getParam("srcObjectType"),
        edgeName: ctx.getParam("edgeName"),
        error: error.message,
      });

      const lockKey = ctx.getParam("lockKey");
      const lockHolder = ctx.getParam("lockHolder");

      await this.freeLock(ctx, lockKey, lockHolder);
    },
    (ctx) => {
      ctx.metrics.getCounter("persistence_create_edge").inc({
        srcObjectType: ctx.getParam("srcObjectType"),
        edgeName: ctx.getParam("edgeName"),
      });
    }
  );

  deleteEdge = wrapper(
    { name: "deleteEdge", file: __filename },
    async (
      ctx: Context,
      src: ObjectId,
      edgeName: string,
      dst: ObjectId
    ): Promise<void> => {
      ctx.startTrackTime(
        "persistence_delete_edge_duration",
        "persistence_delete_edge_error_duration"
      );

      const srcObjectType = await getObjectTypeFromId(ctx, src);

      ctx.register({ src, edgeName, dst });

      ctx.setParam("srcObjectType", srcObjectType);
      ctx.setParam("edgeName", edgeName);

      ctx.setErrorDurationMetricLabels({ srcObjectType, edgeName });

      const lockKey = `${src}-${edgeName}-${dst}`;
      const cacheKey = `e_${src}-${edgeName}`;

      const lockHolder = await this.getLock(ctx, lockKey);

      ctx.setParam("lockKey", lockKey);
      ctx.setParam("lockHolder", lockHolder);

      await this.cache.lrem(ctx, cacheKey, dst);

      await this.primaryDB.deleteEdge(ctx, src, edgeName, dst);

      await this.freeLock(ctx, lockKey, lockHolder);

      await queue.send(ctx, {
        method: "DELETE",
        path: `${srcObjectType}/${edgeName}`,
        type: "object",
        previous: {
          src,
          edgeName,
          dst,
        },
      });

      ctx.setDurationMetricLabels({ srcObjectType });
    },
    async (ctx, error) => {
      ctx.metrics.getCounter("persistence_delete_edge_error").inc({
        srcObjectType: ctx.getParam("srcObjectType"),
        edgeName: ctx.getParam("edgeName"),
        error: error.message,
      });

      const lockKey = ctx.getParam("lockKey");
      const lockHolder = ctx.getParam("lockHolder");

      await this.freeLock(ctx, lockKey, lockHolder);
    },
    (ctx) => {
      ctx.metrics.getCounter("persistence_delete_edge").inc({
        srcObjectType: ctx.getParam("srcObjectType"),
        edgeName: ctx.getParam("edgeName"),
      });
    }
  );

  getEdges = wrapper(
    { name: "getEdges", file: __filename },
    async (
      ctx: Context,
      src: ObjectId,
      edgeName: string
    ): Promise<string[]> => {
      ctx.startTrackTime(
        "persistence_get_edges_duration",
        "persistence_get_edges_error_duration"
      );

      const srcObjectType = await getObjectTypeFromId(ctx, src);

      ctx.register({ src, edgeName });

      ctx.setParam("srcObjectType", srcObjectType);
      ctx.setParam("edgeName", edgeName);

      ctx.setErrorDurationMetricLabels({ srcObjectType, edgeName });

      const cacheKey = `e_${src}-${edgeName}`;

      const isCacheKeyExistingInCache = await this.cache.exists(ctx, cacheKey);

      let result = [];

      if (isCacheKeyExistingInCache) {
        result = (await this.cache.get(ctx, cacheKey)) as string[];
      } else {
        result = await this.primaryDB.getEdges(ctx, src, edgeName);
      }

      ctx.setDurationMetricLabels({ srcObjectType });

      return result;
    },
    (ctx, error) => {
      ctx.metrics.getCounter("persistence_get_edges_error").inc({
        srcObjectType: ctx.getParam("srcObjectType"),
        edgeName: ctx.getParam("edgeName"),
        error: error.message,
      });
    },
    (ctx) => {
      ctx.metrics.getCounter("persistence_get_edges").inc({
        srcObjectType: ctx.getParam("srcObjectType"),
        edgeName: ctx.getParam("edgeName"),
      });
    }
  );

  getReverseEdges = wrapper(
    { name: "getReverseEdges", file: __filename },
    async (
      ctx: Context,
      edgeName: string,
      dst: ObjectId
    ): Promise<string[]> => {
      ctx.startTrackTime(
        "persistence_get_reverse_edges_duration",
        "persistence_get_reverse_edges_error_duration"
      );

      const dstObjectType = await getObjectTypeFromId(ctx, dst);

      ctx.register({ dst, edgeName });

      ctx.setParam("dstObjectType", dstObjectType);
      ctx.setParam("edgeName", edgeName);

      ctx.setErrorDurationMetricLabels({ dstObjectType, edgeName });

      const result = await this.primaryDB.getReverseEdges(ctx, edgeName, dst);

      ctx.setDurationMetricLabels({ dstObjectType });

      return result;
    },
    (ctx, error) => {
      ctx.metrics.getCounter("persistence_get_reverse_edges_error").inc({
        dstObjectType: ctx.getParam("dstObjectType"),
        edgeName: ctx.getParam("edgeName"),
        error: error.message,
      });
    },
    (ctx) => {
      ctx.metrics.getCounter("persistence_get_reverse_edges").inc({
        dstObjectType: ctx.getParam("dstObjectType"),
        edgeName: ctx.getParam("edgeName"),
      });
    }
  );

  checkUnique = async (
    ctx: Context | null,
    objectType: ObjectType,
    fieldName: string,
    value: string | number
  ): Promise<boolean> => {
    return this.primaryDB.checkUnique(ctx, objectType, fieldName, value);
  };

  quit = () => {
    this.primaryDB.quit();
    this.cache.quit();
  };
}
