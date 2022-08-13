// Delete edges table to recreate it with a new structure

import { config } from "@/components";
import { DeleteTableCommand, DynamoDBClient } from "@aws-sdk/client-dynamodb";
import AWS from "aws-sdk";
import http from "http";
import readline from "node:readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const agent = new http.Agent({
  keepAlive: true,
  maxSockets: Infinity,
});

AWS.config.update({
  httpOptions: { agent },
});

const { region, endpoint } = config.persistence.config;

const client = new DynamoDBClient({ region, endpoint });

const deleteTable = async (TableName: string) => {
  const command = new DeleteTableCommand({
    TableName,
  });

  await client.send(command);
};

const promptTableDelete = (tableName: string) => {
  return new Promise((resolve) => {
    rl.question(
      `Deleting table ${tableName}. Confirm? y/N: `,
      async (answer) => {
        if (answer.toLowerCase() === "y") {
          await deleteTable(tableName);
        }

        console.log(`Table ${tableName} deleted successfully.`);

        resolve(null);
      }
    );
  });
};

const main = async () => {
  const tableNames = (process.argv.at(-1) as string).split(",");

  for (const tableName of tableNames) {
    await promptTableDelete(tableName);
  }

  process.exit();
};

main();
