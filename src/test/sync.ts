import { readConfig } from "@/config/read-config";
import { Client } from "@elastic/elasticsearch";

const { config } = readConfig();

const esClient = new Client({
  node: config.sync.config.node,
});

const prefix = (index: string) => {
  return `${config.search.config.prefix}${index}`;
};

export const quit = async () => {
  await esClient.close();
};
