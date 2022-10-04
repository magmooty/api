import { readConfig } from "@/config/read-config";
import IORedis from "ioredis";

const { config } = readConfig();

export const cluster = new IORedis({
  host: config.persistence.cache.config.host,
  port: config.persistence.cache.config.port,
  keyPrefix: config.persistence.cache.config.prefix,
});

export const get = async (key: string) => {
  const object = await cluster.get(key);

  if (!object) {
    return object;
  }

  return JSON.parse(object);
};

export const quit = async () => {
  await cluster.quit();
}