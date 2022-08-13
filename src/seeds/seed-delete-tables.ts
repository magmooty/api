// Delete edges table to recreate it with a new structure

import { config } from "@/components";
import {
  DeleteTableCommand,
  DynamoDBClient,
  ListTablesCommand,
} from "@aws-sdk/client-dynamodb";
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

const listTables = async (): Promise<string[]> => {
  const { TableNames } = await client.send(new ListTablesCommand({}));
  return TableNames || [];
};

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

        resolve(null);
      }
    );
  });
};

const main = async () => {
  const tableNames = (process.argv.at(-1) as string).split(",");

  const existingTables = await listTables();

  for (const tableName of tableNames) {
    if (existingTables.includes(tableName)) {
      await promptTableDelete(tableName);
      console.log(`Table ${tableName} deleted successfully.`);
    } else {
      console.log(`Table ${tableName} doesn't exist`);
    }
  }

  process.exit();
};

main();
