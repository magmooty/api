import { errors, wrapper } from "@/components";
import { getObjectTypeFromId } from "@/graph";
import { GraphObject } from "@/graph/objects/types";
import { CreateObjectPayload, PersistenceDriver } from "@/persistence";
import { Context } from "@/tracing";
import {
  AttributeValue,
  CreateTableCommand,
  CreateTableCommandOutput,
  DeleteItemCommand,
  DeleteItemCommandOutput,
  DynamoDBClient,
  GetItemCommand,
  GetItemCommandOutput,
  ListTablesCommand,
  ListTablesCommandOutput,
  PutItemCommand,
  PutItemCommandOutput,
  UpdateItemCommand,
  UpdateItemCommandOutput,
} from "@aws-sdk/client-dynamodb";
import { Command } from "@aws-sdk/smithy-client";
import AWS from "aws-sdk";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import http from "http";
import { generateID } from "./common";
import AttributeMap = DocumentClient.AttributeMap;

const { marshall, unmarshall } = AWS.DynamoDB.Converter;

export interface DynamoDBConfig {
  region: string;
  prefix: string;
  maxRetries: number;
  allowedRetryErrorCodes: string[];
  endpoint?: string;
  retryAfter: number;
}

export interface CommandOutput<T = unknown> {
  retries: number;
  result: T;
}

const DYNAMO_TABLES = [
  "objects",
  "edges",
  "counters",
  "uniques",
  "lookups",
] as const;

export class DynamoPersistenceDriver implements PersistenceDriver {
  client: DynamoDBClient;

  constructor(private dynamoConfig: DynamoDBConfig) {
    const agent = new http.Agent({
      keepAlive: true,
      maxSockets: Infinity,
    });

    AWS.config.update({
      httpOptions: { agent },
    });

    const { region, endpoint } = dynamoConfig;

    this.client = new DynamoDBClient({ region, endpoint });
  }

  private listTableNames = wrapper(
    { name: "listTableNames", file: __filename },
    async (ctx: Context) => {
      const command = new ListTablesCommand({});

      try {
        const { result } = (await this.sendCommand(
          null,
          command
        )) as CommandOutput<ListTablesCommandOutput>;
        ctx.log.debug("Got table names", { result });
        return result.TableNames || [];
      } catch (error) {
        ctx.log.error(error, "Failed to fetch table names");
        throw error;
      }
    }
  );

  private constructTableSchema(tableName: string, primaryKey: string) {
    return {
      TableName: this.prefixTableName(tableName),
      BillingMode: "PAY_PER_REQUEST",
      AttributeDefinitions: [
        {
          AttributeName: primaryKey,
          AttributeType: "S",
        },
      ],
      KeySchema: [
        {
          AttributeName: primaryKey,
          KeyType: "HASH",
        },
      ],
    };
  }

  private createTable = wrapper(
    { name: "createTable", file: __filename },
    async (
      ctx: Context,
      table: typeof DYNAMO_TABLES[number]
    ): Promise<CommandOutput<CreateTableCommandOutput> | void> => {
      ctx.register({ table });

      let command: CreateTableCommand;

      switch (table) {
        case "objects":
          command = new CreateTableCommand(
            this.constructTableSchema("objects", "id")
          );
          break;
        case "counters":
          command = new CreateTableCommand(
            this.constructTableSchema("counters", "id")
          );
          break;
        case "edges":
          command = new CreateTableCommand(
            this.constructTableSchema("edges", "src_edgeName")
          );
          break;
        case "lookups":
          command = new CreateTableCommand(
            this.constructTableSchema("lookups", "code")
          );
          break;
        case "uniques":
          command = new CreateTableCommand(
            this.constructTableSchema("uniques", "id")
          );
          break;
        default:
          ctx.fatal("Couldn't create table", { table });
          return;
      }

      return this.sendCommand(ctx, command) as Promise<
        CommandOutput<CreateTableCommandOutput>
      >;
    }
  );

  init = wrapper({ name: "init", file: __filename }, async (ctx: Context) => {
    const tableNames = await this.listTableNames();

    ctx.log.debug("Fetched table names", { tableNames });

    for (const table of DYNAMO_TABLES) {
      const isCreated = tableNames.includes(this.prefixTableName(table));

      if (isCreated) {
        ctx.log.debug("Found table", { table, isCreated });
      }

      if (!isCreated) {
        await this.createTable(ctx, table);
      }
    }

    ctx.log.debug("All tables are ensured to exist");
  });

  private prefixTableName(table: string) {
    return `${this.dynamoConfig.prefix}${table}`;
  }

  private async canRetryDynamoDBQuery(err: Error, retries: number) {
    const { allowedRetryErrorCodes } = this.dynamoConfig;

    if (
      allowedRetryErrorCodes.some((code) => err.name === code) &&
      retries < 0
    ) {
    }

    return false;
  }

  private async serializeDocument(
    object: GraphObject | Partial<GraphObject> | Object
  ): Promise<AttributeMap> {
    return marshall(object);
  }

  private async unserializeDocument<T = GraphObject>(
    object: Record<string, AttributeValue>
  ): Promise<T> {
    return unmarshall(object) as unknown as T;
  }

  private sendCommand = wrapper(
    { name: "sendCommand", file: __filename },
    async (
      ctx: Context,
      command: Command<any, any, any>,
      retries = 0
    ): Promise<CommandOutput> => {
      ctx.register({ input: command.input, retries });

      try {
        const result = await this.client.send(command);

        ctx.log.debug("Command result", { result });

        return { result, retries };
      } catch (error) {
        if (await this.canRetryDynamoDBQuery(error as Error, retries)) {
          const { retryAfter } = this.dynamoConfig;

          ctx.log.error(
            error,
            `Dynamo command failed, retrying agian in ${
              retryAfter / 1000
            } seconds`,
            {
              input: command.input,
              retries,
            }
          );

          // Wait for a while, then retry
          await setTimeout(Promise.resolve, retryAfter);

          return this.sendCommand(ctx, command, retries);
        }

        throw error;
      }
    }
  );

  getObject = wrapper(
    { name: "getObject", file: __filename },
    async <T = GraphObject>(ctx: Context, id: string): Promise<T> => {
      ctx.startTrackTime(
        "dynamo_get_object_duration",
        "dynamo_get_object_error_duration"
      );

      ctx.register({
        id,
      });

      const objectType = await getObjectTypeFromId(ctx, id);

      ctx.setErrorDurationMetricLabels({ objectType });

      ctx.metrics.getCounter("dynamo_get_object").inc({ objectType });

      const Key: AttributeMap = marshall({ id });

      const TableName = this.prefixTableName("objects");

      const command = new GetItemCommand({ TableName, Key });

      const { result, retries } = (await this.sendCommand(
        ctx,
        command
      )) as CommandOutput<GetItemCommandOutput>;

      ctx.metrics
        .getCounter("dynamo_retries")
        .inc({ method: "getObject", objectType }, retries);

      if (!result.Item) {
        return errors.createError(ctx, "ObjectDoesNotExist", { id });
      }

      ctx.setDurationMetricLabels({ objectType, retries });

      return this.unserializeDocument(result.Item);
    }
  );

  createObject = wrapper(
    { name: "createObject", file: __filename },
    async <T = GraphObject>(
      ctx: Context,
      payload: CreateObjectPayload
    ): Promise<T> => {
      ctx.startTrackTime(
        "dynamo_create_object_duration",
        "dynamo_create_object_error_duration"
      );

      ctx.register({ payload });

      const { object_type: objectType } = payload;

      ctx.setErrorDurationMetricLabels({ objectType });

      ctx.log.debug("Generating new id for object", { objectType });

      const id = await generateID(ctx, objectType);

      const object: GraphObject = { ...payload, id };

      ctx.register({
        object,
      });

      ctx.metrics.getCounter("dynamo_create_object").inc({ objectType });

      const Item = await this.serializeDocument(object);

      const TableName = this.prefixTableName("objects");

      const command = new PutItemCommand({
        TableName,
        Item,
      });

      const { result, retries } = (await this.sendCommand(
        ctx,
        command
      )) as CommandOutput<PutItemCommandOutput>;

      ctx.metrics
        .getCounter("dynamo_retries")
        .inc({ method: "createObject", objectType }, retries);

      if (result?.$metadata?.httpStatusCode !== 200) {
        return errors.createError(ctx, "ObjectCreationFailed", { object });
      }

      ctx.setDurationMetricLabels({ objectType, retries });

      return object as any;
    }
  );

  private constructUpdateExpression = async (payload: Partial<GraphObject>) => {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id, objectType, ...object } = payload;

    const marshalled = await this.serializeDocument(object);

    const keys = Object.keys(object);

    const UpdateExpression = `set ${keys
      .map((key) => `#${key} = :${key}`)
      .join(",")}`;

    const ExpressionAttributeNames: Record<string, string> = {};
    const ExpressionAttributeValues: Record<string, AttributeValue> = {};

    keys.forEach((key) => {
      ExpressionAttributeNames[`#${key}`] = key;
      ExpressionAttributeValues[`:${key}`] = marshalled[key];
    });

    return {
      UpdateExpression,
      ExpressionAttributeNames,
      ExpressionAttributeValues,
    };
  };

  updateObject = wrapper(
    { name: "updateObject", file: __filename },
    async <T = GraphObject>(
      ctx: Context,
      id: string,
      payload: CreateObjectPayload
    ): Promise<T> => {
      ctx.startTrackTime(
        "dynamo_update_object_duration",
        "dynamo_update_object_error_duration"
      );

      ctx.register({
        id,
        payload,
      });

      const objectType = await getObjectTypeFromId(ctx, id);

      const object: GraphObject = { ...payload, object_type: objectType, id };

      ctx.setErrorDurationMetricLabels({ objectType });

      ctx.metrics.getCounter("dynamo_update_object").inc({ objectType });

      const TableName = this.prefixTableName("objects");

      const Key: AttributeMap = marshall({ id });

      const expression = await this.constructUpdateExpression(object);

      const command = new UpdateItemCommand({
        TableName,
        Key,
        ...expression,
        ReturnValues: "ALL_NEW",
      });

      const { result, retries } = (await this.sendCommand(
        ctx,
        command
      )) as CommandOutput<UpdateItemCommandOutput>;

      ctx.metrics
        .getCounter("dynamo_retries")
        .inc({ method: "updateObject", objectType }, retries);

      const updatedObject = result.Attributes
        ? await this.unserializeDocument(result.Attributes)
        : null;

      if (result?.$metadata?.httpStatusCode !== 200 || !updatedObject) {
        return errors.createError(ctx, "ObjectUpdateFailed", {
          id,
          objectType,
          object,
          updatedObject,
        });
      }

      ctx.setDurationMetricLabels({ objectType, retries });

      return updatedObject as any;
    }
  );

  deleteObject = wrapper(
    { name: "getObject", file: __filename },
    async (ctx: Context, id: string): Promise<void> => {
      ctx.startTrackTime(
        "dynamo_delete_object_duration",
        "dynamo_delete_object_error_duration"
      );

      ctx.register({
        id,
      });

      const objectType = await getObjectTypeFromId(ctx, id);

      ctx.setErrorDurationMetricLabels({ objectType });

      ctx.metrics.getCounter("dynamo_delete_object").inc({ objectType });

      const Key: AttributeMap = marshall({ id });

      const TableName = this.prefixTableName("objects");

      const command = new DeleteItemCommand({ TableName, Key });

      const { result, retries } = (await this.sendCommand(
        ctx,
        command
      )) as CommandOutput<DeleteItemCommandOutput>;

      ctx.metrics
        .getCounter("dynamo_retries")
        .inc({ method: "deleteObject", objectType }, retries);

      if (result?.$metadata?.httpStatusCode !== 200) {
        return errors.createError(ctx, "ObjectDeleteFailed", {
          id,
          objectType,
        });
      }

      ctx.setDurationMetricLabels({ objectType, retries });

      return;
    }
  );
}
