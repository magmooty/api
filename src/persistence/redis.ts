import { CacheDriver } from "@flowhealth/mp-commons/cacheV2";
import config from "@flowhealth/mp-commons/config";
import { randomBytes } from "crypto";
import { Span } from "opentracing";
import * as commons from "../helpers/commonsV2.helpers";
import { controllerLogWrapper } from "../helpers/components";
import {
  CounterModifier,
  FirstAndLastParams,
  GraphObject,
  Edge,
  Lookup,
  Unique,
  StorageDriver,
  MethodOptions,
} from "./types";
import { setTimeout } from "timers/promises";
import { PersistenceDriver } from ".";
import { wrapper } from "@/components";
import { Context } from "@/tracing";

const driver = new CacheDriver(config.cacheDriverOptions);

// All values that represent time are in seconds
const OPTIONS = {
  LOCK_TIMEOUT: 30,
  LOCK_OBTAINER_TIMEOUT: 33,
  LOCK_ATTEMPT_INTERVAL: 0.1,
  LOOKUPS_TTL: 172800,
};

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

/**
 * Extract cache key for edge or reverse edge
 * @param {string} src
 * @param {string} edgeName
 * @returns {string} Cache key
 */
function generateEdgeKey(src: string, edgeName: string) {
  return `e_${src}-${edgeName}`;
}

/**
 * Extract cache key for edge or reverse edge
 * @param {string} dst
 * @param {string} edgeName
 * @returns {string} Cache key
 */
function generateReverseEdgeKey(dst: string, edgeName: string) {
  return `re_${edgeName}-${dst}`;
}

/**
 * Wait for a certain period of time
 * @param {number} s Input in seconds
 * @returns {Promise<void>} Resolves when time period is over
 */
function wait(s: number): Promise<null> {
  return setTimeout(s * 1000, null);
}

const doInParallel = <T, A>(
  array: T[],
  fn: (item: T) => Promise<A>
): Promise<A[]> => Promise.all(array.map((item) => fn(item)));

export class RedisPersistenceDriver implements PersistenceDriver {
  constructor(private secondaryDB: PersistenceDriver) {}

  init(): Promise<void> {
    return Promise.resolve();
  }

  /**
   * This method should get a key lock. If it can't be obtained now, the method has to wait.
   * @param {string} key The key to obtain a lock for
   * @param {Span} rootSpan OpenTracing root span
   * @returns {string} String to free the lock with
   */
  getLock = wrapper(
    { name: "getLock", file: __filename },
    async (ctx: Context, key: string): Promise<string> => {
      const prefixedKey = generateLockKey(key);
      const lockHolder = generateLockHolder();

      ctx.log.info("Trying to obtain a lock for key", { key, lockHolder });

      let retries = 0;

      while (true) {
        const lockObtained = await driver.set(
          prefixedKey,
          lockHolder,
          OPTIONS.LOCK_TIMEOUT,
          true
        );

        if (lockObtained) {
          ctx.log.info("Obtained a lock for key", { key, lockHolder });
          return lockHolder;
        }

        if (
          retries * OPTIONS.LOCK_ATTEMPT_INTERVAL >=
          OPTIONS.LOCK_OBTAINER_TIMEOUT
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
        await wait(OPTIONS.LOCK_ATTEMPT_INTERVAL);
      }
    }
  );

  async freeLock(
    key: string,
    lockHolder: string,
    rootSpan?: Span
  ): Promise<void> {
    return controllerLogWrapper(
      { topic: "freeLock", location: __dirname, rootSpan },
      async (_, Log) => {
        const prefixedKey = generateLockKey(key);

        const existingLockHolder = await driver.get(prefixedKey, true);

        ctx.log.info("Freeing lock", { prefixedKey, existingLockHolder });

        if (!existingLockHolder) {
          ctx.log.info("Lock is already free");
          return;
        }

        if (existingLockHolder === lockHolder) {
          await driver.del(prefixedKey);
          ctx.log.info("Lock freed", { lockHolder });
          return;
        }

        ctx.log.info("Resource has been locked by another process", {
          existingLockHolder,
        });
        return;
      }
    );
  }

  async createObject(
    object: GraphObject,
    rootSpan?: Span,
    options?: MethodOptions
  ) {
    return controllerLogWrapper(
      { topic: "createObject", location: __dirname, rootSpan },
      async (_, Log) => {
        if (options.ignoreCache) {
          ctx.log.info("Ignore cache flag is set");
          return object;
        }

        const { id, object_type: objectType } = object;

        const ttl = ttlMapping(options.ttl) || getTTL(objectType);

        ctx.log.info(`Saving object ${id}`, { id, objectType, ttl, object });

        await driver.set(id, object, ttl);

        return object;
      }
    );
  }

  async getObject(
    id: string,
    rootSpan?: Span,
    ignoreList: string[] = [],
    options?: MethodOptions
  ): Promise<GraphObject> {
    return controllerLogWrapper(
      { topic: "getObject", location: __dirname, rootSpan },
      async (span, Log) => {
        ctx.log.info("Getting object from cache", { id });

        let object;

        if (options.ignoreCache) {
          ctx.log.info("Ignore cache flag was set");
        } else {
          object = (await driver.get(id)) as unknown as GraphObject;
        }

        if (!object) {
          if (!options.ignoreCache) {
            ctx.log.info("Object not found in cache", { object });
          }

          object = await this.secondaryDB.getObject(id, span, ignoreList);
        }

        ctx.log.info("Got object", { object });

        if (object) {
          Object.keys(object).forEach((field) => {
            if (ignoreList && ignoreList.includes(field)) {
              delete object[field];
            }
          });

          const counterFields = getCounterFields(
            config.graph[object.object_type],
            ignoreList
          );

          if (counterFields.length) {
            await doInParallel(counterFields, async (field: string) => {
              const valueCounter = await this.getCounter(
                object.id,
                field,
                span,
                options
              );

              if (valueCounter !== null) {
                object[field] = valueCounter;
              }
            });
          }

          ctx.log.info("Get object successfully", { object });
        }

        return object;
      }
    );
  }

  async updateObject(
    id: string,
    object: GraphObject,
    rootSpan?: Span,
    previousEvent?: GraphObject,
    options: MethodOptions = {}
  ): Promise<GraphObject> {
    let lockHolder;

    return controllerLogWrapper(
      { topic: "updateObject", location: __dirname, rootSpan },
      async (span, Log) => {
        const objectType = await commons.getObjectType(id);
        const updatedObject = { ...object, id, object_type: objectType };

        if (options.ignoreCache) {
          ctx.log.info("Ignore cache flag is set");
          return updatedObject;
        }

        const ttl = ttlMapping(options.ttl) || getTTL(objectType);

        ctx.log.info("Found TTL for object", { id, objectType, ttl });

        if (!options.noLocks) {
          lockHolder = await this.getLock(id, span);
        }

        await driver.set(id, updatedObject, ttl);

        ctx.log.info("Updated object and freeing lock", { updatedObject });

        if (!options.noLocks) {
          await this.freeLock(id, lockHolder, span);
        }

        return updatedObject;
      },
      async (_: Error, span: Span) => {
        if (!options.noLocks) {
          await this.freeLock(id, lockHolder, span);
        }
      }
    );
  }

  async replaceObject(
    id: string,
    object: GraphObject,
    rootSpan?: Span,
    previousEvent?: GraphObject,
    options: MethodOptions = {}
  ): Promise<GraphObject> {
    let lockHolder;

    return controllerLogWrapper(
      { topic: "replaceObject", location: __dirname, rootSpan },
      async (span, Log) => {
        const objectType = await commons.getObjectType(id);
        const replacedObject = { ...object, id, object_type: objectType };

        if (options.ignoreCache) {
          ctx.log.info("Ignore cache flag is set");
          return replacedObject;
        }

        if (!options.noLocks) {
          lockHolder = await this.getLock(id, span);
        }

        await driver.set(id, replacedObject);

        ctx.log.info("Replacing object and freeing lock", { replacedObject });

        if (!options.noLocks) {
          await this.freeLock(id, lockHolder, span);
        }

        return replacedObject;
      },
      async (_: Error, span: Span) => {
        if (!options.noLocks) {
          await this.freeLock(id, lockHolder, span);
        }
      }
    );
  }

  async deleteObject(
    id: string,
    rootSpan?: Span,
    previousEvent?: GraphObject,
    options?: MethodOptions
  ): Promise<void> {
    let lockHolder;

    return controllerLogWrapper(
      { topic: "deleteObject", location: __dirname, rootSpan },
      async (span, Log) => {
        if (options.ignoreCache) {
          ctx.log.info("Ignore cache flag is set");
          return;
        }

        if (!options.noLocks) {
          lockHolder = await this.getLock(id, span);
        }

        ctx.log.info("Deleting object and freeing lock", { id });

        await driver.del(id);

        if (!options.noLocks) {
          await this.freeLock(id, lockHolder, span);
        }
      },
      async (_: Error, span: Span) => {
        if (!options.noLocks) {
          await this.freeLock(id, lockHolder, span);
        }
      }
    );
  }

  async getCounter(
    id: string,
    fieldName: string,
    rootSpan?: Span,
    options?: MethodOptions
  ): Promise<number> {
    return controllerLogWrapper(
      { topic: "getCounter", location: __dirname, rootSpan },
      async (span, Log) => {
        if (!options.ignoreCache) {
          ctx.log.info("Getting counter from cache", { id, fieldName });

          const value = await driver.get(`${id}-${fieldName}`);

          if (value || value === 0) {
            ctx.log.info("Found counter value", { value });
            return value;
          }

          ctx.log.info(
            "Counter not found in cache, forwarding to main database",
            {
              value,
            }
          );
        } else {
          ctx.log.info("Ignore cache flag is set");
        }

        return this.secondaryDB.getCounter(id, fieldName, span);
      }
    );
  }

  async setCounter(
    id: string,
    fieldName: string,
    value: CounterModifier,
    previousValue?: number,
    rootSpan?: Span,
    options?: MethodOptions
  ): Promise<void> {
    let lockHolder;
    const counterId = `${id}-${fieldName}`;

    return controllerLogWrapper(
      { topic: "setCounter", location: __dirname, rootSpan },
      async (span, Log) => {
        if (!options.ignoreCache) {
          ctx.log.info("Setting counter in cache", {
            id,
            fieldName,
            value,
            previousValue,
          });

          lockHolder = await this.getLock(counterId, span);

          // Get value from cache
          const oldValue = await driver.get(`${id}-${fieldName}`);

          // If the value already exists in cache, increment/decrement, free the lock and return
          if (oldValue || oldValue === 0) {
            ctx.log.info(
              "Found counter old value in cache, applying increment/decrement",
              { counterId, oldValue }
            );

            let returner = null;

            if (value[0] === "+") {
              returner = await driver.incrBy(
                counterId,
                parseInt(value.substring(1))
              );
            } else if (value[0] === "-") {
              returner = await driver.decrBy(
                counterId,
                parseInt(value.substring(1))
              );
            } else {
              ctx.log.warn("Cannot parse counter", { id, fieldName, value });
            }

            await this.freeLock(counterId, lockHolder, span);

            return returner;
          }

          ctx.log.info(
            "Old counter value was not found in cache, requesting primary database",
            { counterId, oldValue }
          );
        } else {
          // This is very dangerous, we should only be using the ignore cache flag
          // with DynamoDB when it's definitely needed because the result of counters
          // will not always be accurate because there's a delay in db-sync!
          ctx.log.info("Ignore cache flag is set");
        }

        // The value wasn't in the cache, so we try hitting the database
        const secondaryDBValue = await this.secondaryDB.getCounter(
          id,
          fieldName,
          span
        );

        // If the value was found in the database, compute the next value and then write to the cache,
        // then free the lock and return
        if (!isNaN(secondaryDBValue) && secondaryDBValue !== null) {
          if (!options.ignoreCache) {
            ctx.log.info(
              "Old counter value was not found in cache, but found in primary database",
              {
                counterId,
                secondaryDBValue,
              }
            );
          }

          let returner = null;

          if (value[0] === "+") {
            returner = secondaryDBValue + parseInt(value.substring(1));
            await driver.set(counterId, returner);
          } else if (value[0] === "-") {
            returner = secondaryDBValue - parseInt(value.substring(1));
            await driver.set(counterId, returner);
          } else {
            ctx.log.warn("Cannot parse counter", { id, fieldName, value });
          }

          await this.freeLock(counterId, lockHolder, span);

          return returner;
        } else {
          if (options.ignoreCache) {
            ctx.log.info("Counter wasn't found in the DB");
            await this.freeLock(counterId, lockHolder, span);
            return null;
          }
          // If the value wasn't found in the cache or the database, then it's a new counter
          // Write to the cache, free the lock and return
          ctx.log.info(
            "Counter was not found in primary database nor in cache, setting in cache",
            { secondaryDBValue }
          );

          let returner = null;

          if (value[0] === "+") {
            returner = await driver.incrBy(
              counterId,
              parseInt(value.substring(1))
            );
          } else if (value[0] === "-") {
            returner = await driver.decrBy(
              counterId,
              parseInt(value.substring(1))
            );
          } else {
            ctx.log.warn("Cannot parse counter", { id, fieldName, value });
          }

          await this.freeLock(counterId, lockHolder, span);

          return returner;
        }
      },
      async (_: Error, span: Span) => {
        await this.freeLock(counterId, lockHolder, span);
      }
    );
  }

  addUnique(
    value: Unique,
    rootSpan?: Span,
    options?: MethodOptions
  ): Promise<void> {
    let lockHolder;

    return controllerLogWrapper(
      { topic: "addUnique", location: __dirname, rootSpan },
      async (span, Log) => {
        if (options.ignoreCache) {
          ctx.log.info("Ignore cache flag is set");

          const unique = await this.secondaryDB.checkUnique(value.id, span);

          if (unique.length) {
            ctx.log.warn("Unique value already exists", { value });
            throw new Error("NotUnique");
          }

          return;
        }

        lockHolder = await this.getLock(value.id, span);

        ctx.log.info("Adding a new unique", { value });

        const uniqueId = `unique_${value.id}`;

        const isSetInCache = await driver.get(uniqueId, true);

        if (isSetInCache) {
          await this.freeLock(value.id, lockHolder, span);
          ctx.log.warn("Unique value already exists", { isSetInCache, value });
          throw new Error("NotUnique");
        }

        const isSetInDB = await this.secondaryDB.checkUnique(value.id, span);

        ctx.log.info("Got unique from DB", { isSetInDB });

        if (!isSetInDB.length) {
          await driver.setnx(uniqueId, value.object_id);
          ctx.log.info("Add unique successfully", { value });
        } else {
          await this.freeLock(value.id, lockHolder, span);
          ctx.log.warn("Unique value already exists", { value });
          throw new Error("NotUnique");
        }
      },
      async (_: Error, span: Span) => {
        await this.freeLock(value.id, lockHolder, span);
      }
    );
  }

  checkUnique(
    id: string,
    rootSpan?: Span,
    options?: MethodOptions
  ): Promise<Unique[]> {
    return controllerLogWrapper(
      { topic: "checkUnique", location: __dirname, rootSpan },
      async (span, Log) => {
        if (options.ignoreCache) {
          ctx.log.info("Ignore cache flag is set");
          return this.secondaryDB.checkUnique(id, span);
        }

        ctx.log.info("Checking unique in cache", { id });

        const uniqueId = `unique_${id}`;

        const isSetInCache = await driver.get(uniqueId, true);

        if (isSetInCache) {
          return [{ id, object_id: isSetInCache }];
        }

        const isSetInDB = await this.secondaryDB.checkUnique(id, span);

        ctx.log.info("Got unique from DB", { isSetInDB });

        return isSetInDB;
      }
    );
  }

  removeUnique(
    id: string,
    rootSpan?: Span,
    options?: MethodOptions
  ): Promise<void> {
    return controllerLogWrapper(
      { topic: "removeUnique", location: __dirname, rootSpan },
      async (span, Log) => {
        if (options.ignoreCache) {
          ctx.log.info("Ignore cache flag is set");
          return;
        }

        ctx.log.info("Removing unique", { id });

        const uniqueId = `unique_${id}`;

        console.log({ uniqueId });

        await driver.del(uniqueId);

        console.log("Deleted");

        ctx.log.info("Removed unique from cache", { uniqueId });
      }
    );
  }

  getLookupItem(
    code: string,
    rootSpan?: Span,
    options?: MethodOptions
  ): Promise<Lookup[]> {
    return controllerLogWrapper(
      { topic: "getLookupItem", location: __dirname, rootSpan },
      async (span, Log) => {
        if (options.ignoreCache) {
          return this.secondaryDB.getLookupItem(code, span);
        }

        ctx.log.info("Fetching lookup item", { code });

        const lookupId = `lookup_${code}`;

        const value = await driver.get(lookupId, true);

        if (value) {
          ctx.log.info("Got lookup from cache", { lookupId, value });
          return [{ code, value }];
        }

        ctx.log.info(
          "Lookup not found in cache, checking in primary database",
          {
            code,
          }
        );

        return this.secondaryDB.getLookupItem(code, span);
      }
    );
  }

  createLookupItem(
    code: string,
    value: string,
    rootSpan?: Span,
    options?: MethodOptions
  ): Promise<void> {
    return controllerLogWrapper(
      { topic: "createLookupItem", location: __dirname, rootSpan },
      async (_, Log) => {
        if (options.ignoreCache) {
          ctx.log.info("Ignore cache flag is set");
          return;
        }

        ctx.log.info("Creating lookup item", { code });

        const lookupId = `lookup_${code}`;

        // This will not override the last value if the TTL on it didn't expire yet
        await driver.set(lookupId, value, OPTIONS.LOOKUPS_TTL, true);

        ctx.log.info("Lookup set", { code, value });
      }
    );
  }

  deleteLookupItem(
    code: string,
    rootSpan?: Span,
    options?: MethodOptions
  ): Promise<void> {
    return controllerLogWrapper(
      { topic: "deleteLookupItem", location: __dirname, rootSpan },
      async (_, Log) => {
        if (options.ignoreCache) {
          ctx.log.info("Ignore cache flag is set");
          return;
        }

        ctx.log.info("Deleting lookup item", { code });

        const lookupId = `lookup_${code}`;

        await driver.del(lookupId);

        ctx.log.info("Lookup deleted", { code });
      }
    );
  }

  createEdge(
    src: string,
    edgeName: string,
    dst: string,
    sortValue?: string,
    rootSpan?: Span,
    options: MethodOptions = {}
  ): Promise<void> {
    let lockHolder;
    const lockKey = `${src}-${edgeName}-${dst}`;

    return controllerLogWrapper(
      { topic: "createEdge", location: __dirname, rootSpan },
      async (span, Log) => {
        if (options.ignoreCache) {
          ctx.log.info("Ignore cache flag is set");
          return;
        }

        ctx.log.info("Creating edge", { src, edgeName, dst });

        if (!options.noLocks) {
          lockHolder = await this.getLock(lockKey, span);
        }

        const edgeKey = generateEdgeKey(src, edgeName);
        const reverseEdgeKey = generateReverseEdgeKey(dst, edgeName);

        const position = await driver.lpos(edgeKey, dst);

        const isExisting = position > 0 || position === 0;

        if (!isExisting) {
          const isEdgePopulatedInCache = await driver.exists(edgeKey);

          let dsts;

          if (!isEdgePopulatedInCache) {
            dsts = await this.secondaryDB.getAllEdges(src, edgeName, span, {
              scanForward: true,
            });
          }

          // If edges already exist in the DB, copy edges and copy reverse edges
          if (dsts && dsts.length) {
            await driver.lpush(edgeKey, ...dsts, dst);
            // We won't copy reverse edges because it will require a lot of operations to get the
            // reverse edges of each destination, it's better to ready from the secondaryDB
            // directly for this specific case because with time, this case will be very rare
            // since it will fill itself with new data
          } else {
            // If this is an entirely new edge, create in cache directly
            await driver.lpush(edgeKey, dst);
            await driver.lpush(reverseEdgeKey, src);
          }
        }

        if (!options.noLocks) {
          await this.freeLock(lockKey, lockHolder, span);
        }
      },
      async (_: Error, span: Span) => {
        if (!options.noLocks) {
          await this.freeLock(lockKey, lockHolder, span);
        }
      }
    );
  }

  getEdge(
    src: string,
    edgeName: string,
    dst: string,
    rootSpan?: Span,
    options?: MethodOptions
  ): Promise<Edge> {
    return controllerLogWrapper(
      { topic: "deleteLookupItem", location: __dirname, rootSpan },
      async (span, Log) => {
        if (options.ignoreCache) {
          ctx.log.info("Ignore cache flag is set");
          return this.secondaryDB.getEdge(src, edgeName, dst, span);
        }

        ctx.log.info("Getting edge", { src, edgeName, dst });

        const edgeKey = generateEdgeKey(src, edgeName);

        const position = await driver.lpos(edgeKey, dst);

        if (position > 0 || position === 0) {
          return { src, name: edgeName, dst };
        }

        return this.secondaryDB.getEdge(src, edgeName, dst, span);
      }
    );
  }

  getEdges(
    src: string,
    edgeName: string,
    rootSpan?: Span,
    count?: number,
    after = 0,
    options?: MethodOptions
  ): Promise<string[]> {
    return controllerLogWrapper(
      { topic: "getEdges", location: __dirname, rootSpan },
      async (span, Log) => {
        if (options.ignoreCache) {
          ctx.log.info("Ignore cache flag is set");
          return this.secondaryDB.getEdges(src, edgeName, span, count, after);
        }

        ctx.log.info("Getting edges", { src, edgeName, count, after });

        const edgeKey = generateEdgeKey(src, edgeName);

        const exists = await driver.exists(edgeKey);

        const stop = Number(after) + Number(isNaN(count) ? -1 : count - 1);

        if (exists) {
          return driver.lrange(edgeKey, after, stop);
        }

        return this.secondaryDB.getEdges(src, edgeName, span, count, after);
      }
    );
  }

  getReverseEdges(
    edgeName: string,
    dst: string,
    rootSpan?: Span,
    count?: number,
    after?: number,
    options?: MethodOptions
  ): Promise<string[]> {
    return controllerLogWrapper(
      { topic: "getEdges", location: __dirname, rootSpan },
      async (span, Log) => {
        if (options.ignoreCache) {
          ctx.log.info("Ignore cache flag is set");
          return this.secondaryDB.getReverseEdges(
            edgeName,
            dst,
            span,
            count,
            after
          );
        }

        ctx.log.info("Getting reverse edges", { dst, edgeName, count, after });

        const reverseEdgeKey = generateReverseEdgeKey(dst, edgeName);

        const exists = await driver.exists(reverseEdgeKey);

        const stop = Number(after) + Number(isNaN(count) ? -1 : count - 1);

        if (exists) {
          return driver.lrange(reverseEdgeKey, after, stop);
        }

        return this.secondaryDB.getReverseEdges(
          edgeName,
          dst,
          span,
          count,
          after
        );
      }
    );
  }

  getAllEdges(
    src: string,
    edgeName: string,
    rootSpan?: Span,
    options?: MethodOptions
  ): Promise<string[]> {
    return controllerLogWrapper(
      { topic: "getAllEdges", location: __dirname, rootSpan },
      async (span, Log) => {
        if (options.ignoreCache) {
          ctx.log.info("Ignore cache flag is set");
          return this.secondaryDB.getAllEdges(src, edgeName, span);
        }

        ctx.log.info("Getting all edges", { src, edgeName });

        const edgeKey = generateEdgeKey(src, edgeName);

        const exists = await driver.exists(edgeKey);

        if (exists) {
          const dsts = await driver.lrange(edgeKey, 0, -1);

          return options.scanForward ? dsts.reverse() : dsts;
        }

        return this.secondaryDB.getAllEdges(src, edgeName, span);
      }
    );
  }

  getEdgeCount(
    src: string,
    edgeName: string,
    rootSpan?: Span,
    options?: MethodOptions
  ): Promise<number> {
    return controllerLogWrapper(
      { topic: "getEdgeCount", location: __dirname, rootSpan },
      async (span, Log) => {
        if (options.ignoreCache) {
          ctx.log.info("Ignore cache flag is set");
          return this.secondaryDB.getEdgeCount(src, edgeName, span);
        }

        ctx.log.info("Getting edges count", { src, edgeName });

        const edgeKey = generateEdgeKey(src, edgeName);

        const exists = await driver.exists(edgeKey);

        if (exists) {
          return driver.llen(edgeKey);
        }

        return this.secondaryDB.getEdgeCount(src, edgeName, span);
      }
    );
  }

  getReverseEdgeCount(
    dst: string,
    edgeName: string,
    rootSpan?: Span,
    options?: MethodOptions
  ): Promise<number> {
    return controllerLogWrapper(
      { topic: "getEdgeCount", location: __dirname, rootSpan },
      async (span, Log) => {
        if (options.ignoreCache) {
          ctx.log.info("Ignore cache flag is set");
          return this.secondaryDB.getReverseEdgeCount(dst, edgeName, span);
        }

        ctx.log.info("Getting edges count", { dst, edgeName });

        const reverseEdgeKey = generateReverseEdgeKey(dst, edgeName);

        const exists = await driver.exists(reverseEdgeKey);

        if (exists) {
          return driver.llen(reverseEdgeKey);
        }

        return this.secondaryDB.getReverseEdgeCount(dst, edgeName, span);
      }
    );
  }

  deleteEdge(
    src: string,
    edgeName: string,
    dst: string,
    sortValue?: string,
    rootSpan?: Span,
    options: MethodOptions = {}
  ): Promise<void> {
    let lockHolder;
    const lockKey = `${src}-${edgeName}-${dst}`;

    return controllerLogWrapper(
      { topic: "deleteEdge", location: __dirname, rootSpan },
      async (span, Log) => {
        if (options.ignoreCache) {
          ctx.log.info("Ignore cache flag is set");
          return;
        }

        ctx.log.info("Deleting edge", { src, edgeName, dst });

        if (!options.noLocks) {
          lockHolder = await this.getLock(lockKey, span);
        }

        const edgeKey = generateEdgeKey(src, edgeName);
        const reverseEdgeKey = generateReverseEdgeKey(dst, edgeName);

        await driver.lrem(edgeKey, dst);
        await driver.lrem(reverseEdgeKey, src);

        if (!options.noLocks) {
          await this.freeLock(lockKey, lockHolder, span);
        }
      },
      async (_: Error, span: Span) => {
        if (!options.noLocks) {
          await this.freeLock(lockKey, lockHolder, span);
        }
      }
    );
  }
}
