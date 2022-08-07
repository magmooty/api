import { config } from "@/components";
import {
  DescribeTableCommand,
  DynamoDBClient,
  UpdateTableCommand,
} from "@aws-sdk/client-dynamodb";
import AWS from "aws-sdk";
import http from "http";

const agent = new http.Agent({
  keepAlive: true,
  maxSockets: Infinity,
});

AWS.config.update({
  httpOptions: { agent },
});

const { region, endpoint } = config.persistence.config;

const client = new DynamoDBClient({ region, endpoint });

const getTableInfo = async () => {
  const command = new DescribeTableCommand({
    TableName: "dev_objects",
  });

  const result = await client.send(command);

  console.log(result.Table);
};

const updateTable = async () => {
  const command = new UpdateTableCommand({
    TableName: "dev_objects",
    AttributeDefinitions: [
      {
        AttributeName: "id",
        AttributeType: "S",
      },
      {
        AttributeName: "object_type",
        AttributeType: "S",
      },
    ],
    GlobalSecondaryIndexUpdates: [
      {
        Create: {
          IndexName: "objectTypes",
          Projection: {
            ProjectionType: "ALL",
          },
          KeySchema: [
            {
              KeyType: "HASH",
              AttributeName: "object_type",
            },
          ],
        },
      },
    ],
  });

  await client.send(command);
};

const process = async () => {
  await getTableInfo();
};

process();
