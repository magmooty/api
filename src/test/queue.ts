import { readConfig } from "@/config/read-config";
import { wait } from "@/util/wait";
import { Kafka } from "kafkajs";
import { normalize } from "normalizr";

const { config } = readConfig();

const kafka = new Kafka({
  brokers: config.queue.config.brokers,
});

const admin = kafka.admin();

export const init = async () => {
  await admin.connect();
};

export const waitForEvents = async () => {
  const time = Date.now();
  const timeout = 10000;

  const topic = config.queue.config.topics.find(
    (topic: any) => topic.use === "pushing"
  );

  while (Date.now() < time + timeout) {
    const offsets = await admin.fetchTopicOffsets(topic.name);

    const offsetsByPartition: any = {};

    offsets.forEach((offset) => {
      offsetsByPartition[offset.partition] = offset.high;
    });

    const parallelLogicOffsets = await admin.fetchOffsets({
      groupId: "parallel-logic",
      topics: [topic.name],
    });

    const parallelLogicDone = parallelLogicOffsets.every((offset) => {
      return offset.partitions.every(
        ({ partition, offset }) => offsetsByPartition[partition] <= offset
      );
    });

    const syncOffsets = await admin.fetchOffsets({
      groupId: "sync",
      topics: [topic.name],
    });

    const syncDone = syncOffsets.every((offset) => {
      return offset.partitions.every(
        ({ partition, offset }) => offsetsByPartition[partition] <= offset
      );
    });

    if (parallelLogicDone && syncDone) {
      return true;
    }

    await wait(1000);
  }

  return false;
};

export const quit = async () => {
  await admin.disconnect();
};
