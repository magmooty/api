import { errors, wrapper } from "@/components";
import { getObjectTypeFromId, objects } from "@/graph";
import {
  CounterModifier,
  GraphObject,
  ObjectId,
  ObjectType,
} from "@/graph/objects/types";
import {
  CreateObjectPayload,
  PersistenceDriver,
  SeedObjectsResult,
} from "@/persistence";
import { Context } from "@/tracing";
import {
  Db,
  IndexSpecification,
  MongoClient,
  ObjectId as MongoObjectId,
} from "mongodb";

export interface MongoDBConfig {
  endpoint: string;
  username: string;
  password: string;
  database: string;
}

const MONGO_TABLES = [
  "objects",
  "edges",
  "counters",
  "uniques",
  "lookups",
] as const;

function formatUniqueId(
  objectType: ObjectType,
  fieldName: string,
  value: string | number
) {
  return `${objectType}-${fieldName}-${value}`;
}

export class MongoPersistenceDriver implements PersistenceDriver {
  client: MongoClient;
  db: Db;

  constructor(private mongoConfig: MongoDBConfig) {
    this.client = new MongoClient(mongoConfig.endpoint, {
      auth: {
        username: mongoConfig.username,
        password: mongoConfig.password,
      },
      retryReads: true,
      retryWrites: true,
    });

    this.db = this.client.db(mongoConfig.database);
  }

  private listCollectionNames = wrapper(
    { name: "listCollectionNames", file: __filename },
    async (ctx: Context) => {
      try {
        const result = await this.db.listCollections().toArray();
        ctx.log.info("Got collection names", { result });
        return result.map((collection) => collection.name) || [];
      } catch (error) {
        ctx.log.error(error, "Failed to fetch collection names");
        throw error;
      }
    }
  );

  private ensureIndex = wrapper(
    { name: "ensureIndex", file: __filename },
    async (
      ctx: Context,
      collectionName: typeof MONGO_TABLES[number],
      indexName: string,
      indexPayload: IndexSpecification
    ): Promise<void> => {
      ctx.register({ collectionName });

      const collection = this.db.collection(collectionName);

      const indices = await collection.listIndexes().toArray();

      ctx.log.info(`Fetching indices for ${collectionName}`, {
        indices,
      });

      const indexNames = indices.map((index) => index.name);

      if (indexNames.includes(indexName)) {
        ctx.log.info(
          `Index ${indexName} already exists in ${collection.collectionName}`
        );
        return;
      }

      ctx.log.info(
        `Creating index ${indexName} for ${collection.collectionName}`,
        {
          name: indexName,
          indexPayload,
        }
      );

      await collection.createIndex(indexPayload, { name: indexName });
    }
  );

  private createCollection = wrapper(
    { name: "createCollection", file: __filename },
    async (ctx: Context, table: typeof MONGO_TABLES[number]): Promise<void> => {
      ctx.register({ table });

      switch (table) {
        case "objects":
          await this.db.createCollection("objects");
          await this.ensureIndex(ctx, "objects", "object_type", {
            object_type: 1,
          });
          break;
        case "counters":
          await this.db.createCollection("counters");
          break;
        case "edges":
          await this.db.createCollection("edges");
          await this.ensureIndex(ctx, "edges", "direct", {
            src: 1,
          });
          await this.ensureIndex(ctx, "edges", "reverse", {
            dst: 1,
          });
          break;
        case "lookups":
          await this.db.createCollection("lookups");
          break;
        case "uniques":
          await this.db.createCollection("uniques");
          break;
        default:
          ctx.fatal("Couldn't create table", { table });
          return;
      }
    }
  );

  init = wrapper({ name: "init", file: __filename }, async (ctx: Context) => {
    const tableNames = await this.listCollectionNames();

    ctx.log.info("Fetched table names", { tableNames });

    for (const table of MONGO_TABLES) {
      const isCreated = tableNames.includes(table);

      if (isCreated) {
        ctx.log.info("Found table", { table, isCreated });
      }

      if (!isCreated) {
        await this.createCollection(ctx, table);
      }
    }

    ctx.log.info("All tables are ensured to exist");
  });

  private async serializeDocument(
    object: any
  ): Promise<GraphObject | Partial<GraphObject> | Object> {
    const { id, ...payload } = object;

    return {
      ...payload,
      _id: id,
    };
  }

  private async unserializeDocument<T = GraphObject>(object: any): Promise<T> {
    const { _id, ...payload } = object;
    return {
      ...payload,
      id: _id,
    };
  }

  getObject = wrapper(
    { name: "getObject", file: __filename },
    async <T = GraphObject>(ctx: Context, id: string): Promise<T> => {
      ctx.startTrackTime(
        "mongo_get_object_duration",
        "mongo_get_object_error_duration"
      );

      ctx.register({
        id,
      });

      const objectType = await getObjectTypeFromId(ctx, id);

      ctx.setParam("objectType", objectType);

      ctx.setErrorDurationMetricLabels({ objectType });

      const doc = await this.db.collection("objects").findOne({ _id: id });

      if (!doc) {
        return errors.createError(ctx, "ObjectDoesNotExist", { id });
      }

      ctx.setDurationMetricLabels({ objectType });

      return this.unserializeDocument(doc);
    },
    (ctx, error) => {
      ctx.metrics
        .getCounter("mongo_get_object_error")
        .inc({ objectType: ctx.getParam("objectType"), error: error.message });
    },
    (ctx) => {
      ctx.metrics
        .getCounter("mongo_get_object")
        .inc({ objectType: ctx.getParam("objectType") });
    }
  );

  createObject = wrapper(
    { name: "createObject", file: __filename },
    async <T = GraphObject>(
      ctx: Context,
      id: string,
      payload: CreateObjectPayload
    ): Promise<T> => {
      ctx.startTrackTime(
        "mongo_create_object_duration",
        "mongo_create_object_error_duration"
      );

      ctx.register({ payload });

      const { object_type: objectType } = payload;

      ctx.setParam("objectType", objectType);

      ctx.setErrorDurationMetricLabels({ objectType });

      ctx.log.info("Generating new id for object", { objectType });

      const object: GraphObject = { ...payload, id };

      const doc = await this.serializeDocument(object);

      const result = await this.db.collection("objects").insertOne(doc);

      if (!result.acknowledged) {
        return errors.createError(ctx, "ObjectCreationFailed", { object });
      }

      ctx.setDurationMetricLabels({ objectType });

      return object as any;
    },
    (ctx, error) => {
      ctx.metrics
        .getCounter("mongo_create_object_error")
        .inc({ objectType: ctx.getParam("objectType"), error: error.message });
    },
    (ctx) => {
      ctx.metrics
        .getCounter("mongo_create_object")
        .inc({ objectType: ctx.getParam("objectType") });
    }
  );

  private constructUpdateExpression = async (payload: Partial<GraphObject>) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, object_type: objectType, ...object } = payload;

    const keys = Object.keys(object);

    const $set: any = {};
    const $unset: any = [];

    // set keys
    keys
      .filter((key) => object[key] !== null)
      .forEach((key) => {
        $set[key] = payload[key];
      });

    // removed keys
    keys
      .filter((key) => object[key] === null)
      .forEach((key) => {
        $unset.push(key);
      });

    return {
      $set,
      ...($unset.length && { $unset }),
    };
  };

  updateObject = wrapper(
    { name: "updateObject", file: __filename },
    async <T = GraphObject>(
      ctx: Context,
      id: string,
      payload: Partial<T>
    ): Promise<T> => {
      ctx.startTrackTime(
        "mongo_update_object_duration",
        "mongo_update_object_error_duration"
      );

      ctx.register({
        id,
        payload,
      });

      const objectType = await getObjectTypeFromId(ctx, id);

      ctx.setParam("objectType", objectType);

      const object: GraphObject = { ...payload, object_type: objectType, id };

      ctx.setErrorDurationMetricLabels({ objectType });

      const expression = await this.constructUpdateExpression(object);

      const result = await this.db
        .collection("objects")
        .findOneAndUpdate({ _id: id }, expression, {
          returnDocument: "after",
        });

      if (!result.ok) {
        return errors.createError(ctx, "ObjectUpdateFailed", {
          id,
          objectType,
          object,
        });
      }

      ctx.setDurationMetricLabels({ objectType });

      return await this.unserializeDocument(result.value);
    },
    (ctx, error) => {
      ctx.metrics
        .getCounter("mongo_update_object_error")
        .inc({ objectType: ctx.getParam("objectType"), error: error.message });
    },
    (ctx) => {
      ctx.metrics
        .getCounter("mongo_update_object")
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
        "mongo_replace_object_duration",
        "mongo_replace_object_error_duration"
      );

      ctx.register({ id, payload });

      const objectType = await getObjectTypeFromId(ctx, id);

      ctx.setParam("objectType", objectType);

      ctx.setErrorDurationMetricLabels({ objectType });

      const object: GraphObject = { ...payload, object_type: objectType, id };

      const doc = await this.serializeDocument(object);

      const result = await this.db
        .collection("objects")
        .updateOne({ _id: id }, doc);

      if (!result.acknowledged) {
        return errors.createError(ctx, "ObjectReplaceFailed", { object });
      }

      ctx.setDurationMetricLabels({ objectType });

      return object as any;
    },
    (ctx, error) => {
      ctx.metrics
        .getCounter("mongo_replace_object_error")
        .inc({ objectType: ctx.getParam("objectType"), error: error.message });
    },
    (ctx) => {
      ctx.metrics
        .getCounter("mongo_replace_object")
        .inc({ objectType: ctx.getParam("objectType") });
    }
  );

  deleteObject = wrapper(
    { name: "deleteObject", file: __filename },
    async (ctx: Context, id: string): Promise<void> => {
      ctx.startTrackTime(
        "mongo_delete_object_duration",
        "mongo_delete_object_error_duration"
      );

      ctx.register({
        id,
      });

      const objectType = await getObjectTypeFromId(ctx, id);

      ctx.setParam("objectType", objectType);

      ctx.setErrorDurationMetricLabels({ objectType });

      const result = await this.db.collection("objects").deleteOne({ _id: id });

      if (!result.acknowledged) {
        return errors.createError(ctx, "ObjectDeleteFailed", {
          id,
          objectType,
        });
      }

      ctx.setDurationMetricLabels({ objectType });

      return;
    },
    (ctx, error) => {
      ctx.metrics
        .getCounter("mongo_delete_object_error")
        .inc({ objectType: ctx.getParam("objectType"), error: error.message });
    },
    (ctx) => {
      ctx.metrics
        .getCounter("mongo_delete_object")
        .inc({ objectType: ctx.getParam("objectType") });
    }
  );

  queryObjects = wrapper(
    { name: "queryObjects", file: __filename },
    async <T = GraphObject>(
      ctx: Context,
      objectType: ObjectType,
      projection?: string[] | null,
      after?: any | null
    ): Promise<SeedObjectsResult<T>> => {
      ctx.startTrackTime(
        "mongo_query_objects_duration",
        "mongo_query_objects_error_duration"
      );

      ctx.register({
        objectType,
      });

      if (!objectType || !objects[objectType]) {
        errors.createError(ctx, "ObjectTypeDoesNotExist", { objectType });
      }

      ctx.setErrorDurationMetricLabels({ objectType });

      ctx.setDurationMetricLabels({ objectType });

      ctx.setParam("objectType", objectType);

      const query = this.db
        .collection("objects")
        .find({
          object_type: objectType,
          ...(after && { _id: { $gt: after } }),
        })
        .limit(100);

      if (projection && projection.length) {
        const projectionQuery: any = {};

        projection.forEach(
          (projectedField) => (projectionQuery[projectedField] = 1)
        );

        query.project(projectionQuery);
      }

      const result = await query.toArray();

      let nextKey: MongoObjectId | string | null = null;

      if (result.length <= 0) {
        return { results: [] };
      }

      const results: any[] = await Promise.all(
        result.map(this.unserializeDocument)
      );

      if (results.length) {
        const lastObject = result.at(-1);
        nextKey = lastObject ? lastObject._id : null;
      }

      ctx.metrics
        .getCounter("mongo_queried_objects")
        .inc({ objectType }, result.length || 0);

      return { nextKey, results };
    },
    (ctx, error) => {
      ctx.metrics
        .getCounter("mongo_queried_objects_error")
        .inc({ objectType: ctx.getParam("objectType"), error: error.message });
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
        "mongo_create_edge_duration",
        "mongo_create_edge_error_duration"
      );

      const srcObjectType = await getObjectTypeFromId(ctx, src);

      ctx.register({ src, edgeName, dst });

      ctx.setParam("srcObjectType", srcObjectType);
      ctx.setParam("edgeName", edgeName);

      ctx.setErrorDurationMetricLabels({ srcObjectType, edgeName });

      const sortValue = new Date().getTime();

      await this.db
        .collection("edges")
        .updateOne(
          { src, edge_name: edgeName, dst },
          { $setOnInsert: { sort_value: sortValue } },
          { upsert: true }
        );

      ctx.setDurationMetricLabels({ srcObjectType });
    },
    (ctx, error) => {
      ctx.metrics.getCounter("mongo_create_edge_error").inc({
        srcObjectType: ctx.getParam("srcObjectType"),
        edgeName: ctx.getParam("edgeName"),
        error: error.message,
      });
    },
    (ctx) => {
      ctx.metrics.getCounter("mongo_create_edge").inc({
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
        "mongo_delete_edge_duration",
        "mongo_delete_edge_error_duration"
      );

      const srcObjectType = await getObjectTypeFromId(ctx, src);

      ctx.register({ src, edgeName, dst });

      ctx.setParam("srcObjectType", srcObjectType);
      ctx.setParam("edgeName", edgeName);

      ctx.setErrorDurationMetricLabels({ srcObjectType, edgeName });

      await this.db
        .collection("edges")
        .deleteOne({ src, edge_name: edgeName, dst });

      ctx.setDurationMetricLabels({ srcObjectType });
    },
    (ctx, error) => {
      ctx.metrics.getCounter("mongo_delete_edge_error").inc({
        srcObjectType: ctx.getParam("srcObjectType"),
        edgeName: ctx.getParam("edgeName"),
        error: error.message,
      });
    },
    (ctx) => {
      ctx.metrics.getCounter("mongo_delete_edge").inc({
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
        "mongo_get_edges_duration",
        "mongo_get_edges_error_duration"
      );

      const srcObjectType = await getObjectTypeFromId(ctx, src);

      ctx.register({ src, edgeName });

      ctx.setParam("srcObjectType", srcObjectType);
      ctx.setParam("edgeName", edgeName);

      ctx.setErrorDurationMetricLabels({ srcObjectType, edgeName });

      const result = await this.db
        .collection("edges")
        .find({ src, edge_name: edgeName })
        .sort({ sort_value: 1 })
        .project({ dst: 1 })
        .toArray();

      if (!result || result.length <= 0) {
        return [];
      }

      ctx.setDurationMetricLabels({ srcObjectType });

      return result.map((edge) => edge.dst);
    },
    (ctx, error) => {
      ctx.metrics.getCounter("mongo_get_edges_error").inc({
        srcObjectType: ctx.getParam("srcObjectType"),
        edgeName: ctx.getParam("edgeName"),
        error: error.message,
      });
    },
    (ctx) => {
      ctx.metrics.getCounter("mongo_get_edges").inc({
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
        "mongo_get_reverse_edges_duration",
        "mongo_get_reverse_edges_error_duration"
      );

      const dstObjectType = await getObjectTypeFromId(ctx, dst);

      ctx.register({ dst, edgeName });

      ctx.setParam("dstObjectType", dstObjectType);
      ctx.setParam("edgeName", edgeName);

      ctx.setErrorDurationMetricLabels({ dstObjectType, edgeName });

      const result = await this.db
        .collection("edge")
        .find({ edge_name: edgeName, dst })
        .sort({ sort_value: 1 })
        .project({ src: 1 })
        .toArray();

      if (!result || result.length <= 0) {
        return [];
      }

      ctx.setDurationMetricLabels({ dstObjectType });

      return result.map((edge) => edge.src);
    },
    (ctx, error) => {
      ctx.metrics.getCounter("mongo_get_reverse_edges_error").inc({
        dstObjectType: ctx.getParam("dstObjectType"),
        edgeName: ctx.getParam("edgeName"),
        error: error.message,
      });
    },
    (ctx) => {
      ctx.metrics.getCounter("mongo_get_reverse_edges").inc({
        dstObjectType: ctx.getParam("dstObjectType"),
        edgeName: ctx.getParam("edgeName"),
      });
    }
  );

  addUnique = wrapper(
    { name: "addUnique", file: __filename },
    async (
      ctx: Context,
      objectType: ObjectType,
      fieldName: string,
      value: string | number
    ): Promise<void> => {
      ctx.startTrackTime(
        "mongo_create_unique_duration",
        "mongo_create_unique_error_duration"
      );

      ctx.register({ objectType, fieldName, value });

      ctx.setParam("objectType", objectType);
      ctx.setParam("fieldName", fieldName);

      ctx.setErrorDurationMetricLabels({ objectType, fieldName });

      const result = await this.db.collection("uniques").insertOne({
        _id: formatUniqueId(objectType, fieldName, value) as any,
      });

      if (!result.insertedId) {
        return errors.createError(ctx, "AddUniqueFailed", {
          objectType,
          fieldName,
          value,
        });
      }

      ctx.setDurationMetricLabels({ objectType, fieldName });
    },
    (ctx, error) => {
      ctx.metrics.getCounter("mongo_create_unique_error").inc({
        objectType: ctx.getParam("objectType"),
        fieldName: ctx.getParam("fieldName"),
        error: error.message,
      });
    },
    (ctx) => {
      ctx.metrics.getCounter("mongo_create_unique").inc({
        objectType: ctx.getParam("objectType"),
        fieldName: ctx.getParam("fieldName"),
      });
    }
  );

  checkUnique = wrapper(
    { name: "checkUnique", file: __filename },
    async (
      ctx: Context,
      objectType: ObjectType,
      fieldName: string,
      value: string | number
    ): Promise<boolean> => {
      ctx.startTrackTime(
        "mongo_check_unique_duration",
        "mongo_check_unique_error_duration"
      );

      ctx.register({ objectType, fieldName, value });

      ctx.setParam("objectType", objectType);
      ctx.setParam("fieldName", fieldName);

      ctx.setErrorDurationMetricLabels({ objectType, fieldName });

      const doc = await this.db.collection("uniques").findOne({
        _id: formatUniqueId(objectType, fieldName, value),
      });

      ctx.setDurationMetricLabels({ objectType, fieldName });

      if (doc) {
        return false;
      }

      return true;
    },
    (ctx, error) => {
      ctx.metrics.getCounter("mongo_check_unique_error").inc({
        objectType: ctx.getParam("objectType"),
        fieldName: ctx.getParam("fieldName"),
        error: error.message,
      });
    },
    (ctx) => {
      ctx.metrics.getCounter("mongo_check_unique").inc({
        objectType: ctx.getParam("objectType"),
        fieldName: ctx.getParam("fieldName"),
      });
    }
  );

  removeUnique = wrapper(
    { name: "removeUnique", file: __filename },
    async (
      ctx: Context,
      objectType: ObjectType,
      fieldName: string,
      value: string | number
    ): Promise<void> => {
      ctx.startTrackTime(
        "mongo_remove_unique_duration",
        "mongo_remove_unique_error_duration"
      );

      ctx.register({ objectType, fieldName, value });

      ctx.setParam("objectType", objectType);
      ctx.setParam("fieldName", fieldName);

      ctx.setErrorDurationMetricLabels({ objectType, fieldName });

      const result = await this.db.collection("uniques").deleteOne({
        _id: formatUniqueId(objectType, fieldName, value),
      });

      if (!result.acknowledged) {
        return errors.createError(ctx, "RemoveUniqueFailed", {
          objectType,
          fieldName,
          value,
        });
      }

      ctx.setDurationMetricLabels({ objectType, fieldName });
    },
    (ctx, error) => {
      ctx.metrics.getCounter("mongo_remove_unique_error").inc({
        objectType: ctx.getParam("objectType"),
        fieldName: ctx.getParam("fieldName"),
        error: error.message,
      });
    },
    (ctx) => {
      ctx.metrics.getCounter("mongo_remove_unique").inc({
        objectType: ctx.getParam("objectType"),
        fieldName: ctx.getParam("fieldName"),
      });
    }
  );

  setCounter = wrapper(
    { name: "setCounter", file: __filename },
    async (
      ctx: Context,
      id: string,
      fieldName: string,
      value: CounterModifier
    ): Promise<number> => {
      ctx.startTrackTime(
        "mongo_set_counter_duration",
        "mongo_set_counter_error_duration"
      );

      ctx.register({ id, fieldName, value });

      const objectType = await getObjectTypeFromId(ctx, id);

      ctx.setParam("fieldName", fieldName);
      ctx.setParam("objectType", objectType);

      ctx.setErrorDurationMetricLabels({ fieldName, objectType });

      let payload;

      switch (value[0]) {
        case "+":
          payload = { $inc: { value: Number(value.slice(1)) } };
          break;
        case "-":
          payload = { $inc: { value: -Number(value.slice(1)) } };
          break;
        case "=":
          payload = { $set: { value: Number(value.slice(1)) } };
          break;
        default:
          return errors.createError(ctx, "CounterSetFailed", {
            fieldName,
            value,
          });
      }

      const result = await this.db
        .collection("counters")
        .findOneAndUpdate({ _id: `${id}-${fieldName}` }, payload, {
          upsert: true,
          returnDocument: "after",
          projection: { value: 1 },
        });

      if (!result.ok) {
        return errors.createError(ctx, "CounterSetFailed", {
          fieldName,
          value,
        });
      }

      ctx.setDurationMetricLabels({ objectType, fieldName });

      if (!result.value || !result.value.value) {
        return 0;
      }

      return result.value.value;
    },
    (ctx, error) => {
      ctx.metrics.getCounter("mongo_set_counter_error").inc({
        objectType: ctx.getParam("objectType"),
        fieldName: ctx.getParam("fieldName"),
        error: error.message,
      });
    },
    (ctx) => {
      ctx.metrics.getCounter("mongo_set_counter").inc({
        objectType: ctx.getParam("objectType"),
        fieldName: ctx.getParam("fieldName"),
      });
    }
  );

  getCounter = wrapper(
    { name: "getCounter", file: __filename },
    async (ctx: Context, id: string, fieldName: string): Promise<number> => {
      ctx.startTrackTime(
        "mongo_get_counter_duration",
        "mongo_get_counter_error_duration"
      );

      ctx.register({ id, fieldName });

      const objectType = await getObjectTypeFromId(ctx, id);

      ctx.setParam("fieldName", fieldName);
      ctx.setParam("objectType", objectType);

      ctx.setErrorDurationMetricLabels({ fieldName, objectType });

      const doc = await this.db
        .collection("counters")
        .findOne({ _id: `${id}-${fieldName}` });

      ctx.setDurationMetricLabels({ objectType, fieldName });

      if (!doc || doc.value) {
        return 0;
      }

      return doc.value;
    },
    (ctx, error) => {
      ctx.metrics.getCounter("mongo_get_counter_error").inc({
        objectType: ctx.getParam("objectType"),
        fieldName: ctx.getParam("fieldName"),
        error: error.message,
      });
    },
    (ctx) => {
      ctx.metrics.getCounter("mongo_get_counter").inc({
        objectType: ctx.getParam("objectType"),
        fieldName: ctx.getParam("fieldName"),
      });
    }
  );

  async quit(): Promise<void> {
    await this.client.close();
  }
}
