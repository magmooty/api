import { queue, wrapper } from "@/components";
import { getObjectTypeFromId } from "@/graph";
import {
  GraphObject,
  ObjectFieldValue,
  ObjectId,
  ObjectType,
} from "@/graph/objects/types";
import { Context } from "@/tracing";
import { dryValidation, uniqueValidation } from "./commons/validate-fields";
import { DynamoDBConfig, DynamoPersistenceDriver } from "./dynamodb";

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

export class Persistence {
  primaryDB: PersistenceDriver;

  constructor(private persistenceConfig: PersistenceConfig) {
    switch (persistenceConfig.driver) {
      case "dynamodb":
        this.primaryDB = new DynamoPersistenceDriver(persistenceConfig.config);
        break;
      default:
        throw new Error(
          "Couldn't create persistence driver for driver with current config"
        );
    }
  }

  async init() {
    await this.primaryDB.init();
  }

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

      ctx.setParam("objectType", objectType);

      ctx.setErrorDurationMetricLabels({ objectType });

      const object = await this.primaryDB.getObject<T>(ctx, id);

      ctx.setDurationMetricLabels({ objectType });

      return object;
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
      payload: CreateObjectPayload
    ): Promise<T> => {
      ctx.startTrackTime(
        "persistence_create_object_duration",
        "persistence_create_object_error_duration"
      );

      ctx.register({ payload });

      const { object_type: objectType } = payload;

      ctx.setParam("objectType", objectType);

      ctx.setErrorDurationMetricLabels({ objectType });

      await dryValidation(ctx, objectType, payload as any, false);

      await uniqueValidation(
        ctx,
        objectType,
        null,
        payload as GraphObject,
        this.primaryDB,
        "create"
      );

      const object = await this.primaryDB.createObject(ctx, payload);

      await queue.send(ctx, {
        method: "POST",
        path: objectType,
        type: "object",
        current: object,
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
      payload: Partial<T>
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

      ctx.setParam("objectType", objectType);

      ctx.setErrorDurationMetricLabels({ objectType });

      await dryValidation(ctx, objectType, payload as any, true);

      await uniqueValidation(
        ctx,
        objectType,
        null,
        payload as Partial<GraphObject>,
        this.primaryDB,
        "update"
      );

      const previous = await this.primaryDB.getObject(ctx, id);

      const updatedObject = await this.primaryDB.updateObject(ctx, id, payload);

      await queue.send(ctx, {
        method: "PATCH",
        path: objectType,
        type: "object",
        previous,
        current: updatedObject as any,
      });

      ctx.setDurationMetricLabels({ objectType });

      return updatedObject as any;
    },
    (ctx, error) => {
      ctx.metrics
        .getCounter("persistence_update_object_error")
        .inc({ objectType: ctx.getParam("objectType"), error: error.message });
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

      ctx.setParam("objectType", objectType);

      ctx.setErrorDurationMetricLabels({ objectType });

      await dryValidation(ctx, objectType, payload as any, true);

      await uniqueValidation(
        ctx,
        objectType,
        null,
        payload as GraphObject,
        this.primaryDB,
        "update"
      );

      const previous = await this.primaryDB.getObject(ctx, id);

      const object = await this.primaryDB.replaceObject(ctx, id, payload);

      await queue.send(ctx, {
        method: "PATCH",
        path: objectType,
        type: "object",
        previous,
        current: object,
      });

      ctx.setDurationMetricLabels({ objectType });

      return object as any;
    },
    (ctx, error) => {
      ctx.metrics
        .getCounter("persistence_replace_object_error")
        .inc({ objectType: ctx.getParam("objectType"), error: error.message });
    },
    (ctx) => {
      ctx.metrics
        .getCounter("persistence_replace_object")
        .inc({ objectType: ctx.getParam("objectType") });
    }
  );

  deleteObject = wrapper(
    { name: "deleteObject", file: __filename },
    async (ctx: Context, id: string): Promise<void> => {
      ctx.startTrackTime(
        "persistence_delete_object_duration",
        "persistence_delete_object_error_duration"
      );

      ctx.register({
        id,
      });

      const objectType = await getObjectTypeFromId(ctx, id);

      ctx.setParam("objectType", objectType);

      ctx.setErrorDurationMetricLabels({ objectType });

      const previous = await this.primaryDB.getObject(ctx, id);

      await uniqueValidation(
        ctx,
        objectType,
        null,
        previous as GraphObject,
        this.primaryDB,
        "delete"
      );

      await queue.send(ctx, {
        method: "DELETE",
        path: objectType,
        type: "object",
        previous,
      });

      ctx.setDurationMetricLabels({ objectType });

      return;
    },
    (ctx, error) => {
      ctx.metrics
        .getCounter("persistence_delete_object_error")
        .inc({ objectType: ctx.getParam("objectType"), error: error.message });
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

      await this.primaryDB.createEdge(ctx, src, edgeName, dst);

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
    (ctx, error) => {
      ctx.metrics.getCounter("persistence_create_edge_error").inc({
        srcObjectType: ctx.getParam("srcObjectType"),
        edgeName: ctx.getParam("edgeName"),
        error: error.message,
      });
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

      await this.primaryDB.deleteEdge(ctx, src, edgeName, dst);

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
    (ctx, error) => {
      ctx.metrics.getCounter("persistence_delete_edge_error").inc({
        srcObjectType: ctx.getParam("srcObjectType"),
        edgeName: ctx.getParam("edgeName"),
        error: error.message,
      });
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

      const result = await this.primaryDB.getEdges(ctx, src, edgeName);

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
}
