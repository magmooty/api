// Delete edges table to recreate it with a new structure

import { config } from "@/components";
import { DeleteTableCommand, DynamoDBClient } from "@aws-sdk/client-dynamodb";
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

const deleteEdgesTable = async () => {
  const command = new DeleteTableCommand({
    TableName: "dev_edges",
  });

  await client.send(command);
};

const process = async () => {
  await deleteEdgesTable();
};

process();
