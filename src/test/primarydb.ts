import { readConfig } from "@/config/read-config";
import { MongoClient } from "mongodb";

const { config } = readConfig();

const mongoConfig = config.persistence.config;

const client = new MongoClient(mongoConfig.endpoint, {
  auth: {
    username: mongoConfig.username,
    password: mongoConfig.password,
  },
  retryReads: true,
  retryWrites: true,
});

const db = client.db(mongoConfig.database);

export const getObject = async (id: string): Promise<any> => {
  return await db.collection("objects").findOne({ _id: id });
};

export const quit = async (): Promise<void> => {
  await client.close();
};
