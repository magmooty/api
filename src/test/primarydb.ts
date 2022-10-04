import { readConfig } from "@/config/read-config";
import {
  DynamoDBClient,
  GetItemCommand,
  GetItemCommandOutput,
} from "@aws-sdk/client-dynamodb";
import { Command } from "@aws-sdk/smithy-client";
import AWS from "aws-sdk";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import http from "http";
import AttributeMap = DocumentClient.AttributeMap;

interface CommandOutput<T = unknown> {
  retries: number;
  result: T;
}

const { config } = readConfig();

const { region, endpoint, prefix, allowedRetryErrorCodes, retryAfter } =
  config.persistence.config;

const { marshall, unmarshall } = AWS.DynamoDB.Converter;

const agent = new http.Agent({
  keepAlive: true,
  maxSockets: Infinity,
});

AWS.config.update({
  httpOptions: { agent },
});

const client = new DynamoDBClient({ region, endpoint });

const prefixTableName = (table: string) => {
  return `${prefix}${table}`;
};

const canRetryDynamoDBQuery = (err: Error, retries: number) => {
  if (
    allowedRetryErrorCodes.some((code: string) => err.name === code) &&
    retries < 0
  ) {
  }

  return false;
};

const sendCommand = async (
  command: Command<any, any, any>,
  retries = 0
): Promise<CommandOutput> => {
  try {
    const result = await client.send(command);

    return { result, retries };
  } catch (error) {
    if (await canRetryDynamoDBQuery(error as Error, retries)) {
      // Wait for a while, then retry
      await setTimeout(Promise.resolve, retryAfter);

      return sendCommand(command, retries);
    }

    throw error;
  }
};

export const getObject = async (id: string): Promise<any> => {
  const Key: AttributeMap = marshall({ id });

  const TableName = prefixTableName("objects");

  const command = new GetItemCommand({ TableName, Key });

  const { result } = (await sendCommand(
    command
  )) as CommandOutput<GetItemCommandOutput>;

  if (!result.Item) {
    return undefined;
  }

  return unmarshall(result.Item);
};

export const quit = async (): Promise<void> => {
  await client.destroy();
};
