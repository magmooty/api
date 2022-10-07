import { readConfig } from "@/config/read-config";
import { wait } from "@/util/wait";
import { Kafka } from "kafkajs";
import _ from "lodash";

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

  let oldOffsetsByPartition = null;
  let offsetsEqualHits = 0;

  while (Date.now() < time + timeout) {
    const parallelLogicOffsets = await admin.fetchOffsets({
      groupId: "parallel-logic",
      topics: [topic.name],
    });

    const syncOffsets = await admin.fetchOffsets({
      groupId: "sync",
      topics: [topic.name],
    });

    const offsets = await admin.fetchTopicOffsets(topic.name);

    const offsetsByPartition: any = {};

    offsets.forEach((offset) => {
      offsetsByPartition[offset.partition] = offset.high;
    });

    const parallelLogicDone = parallelLogicOffsets.every((offset) => {
      return offset.partitions.every(
        ({ partition, offset }) => offsetsByPartition[partition] <= offset
      );
    });

    const syncDone = syncOffsets.every((offset) => {
      return offset.partitions.every(
        ({ partition, offset }) => offsetsByPartition[partition] <= offset
      );
    });

    if (_.isEqual(oldOffsetsByPartition, offsetsByPartition)) {
      offsetsEqualHits++;
    }

    if (parallelLogicDone && syncDone && offsetsEqualHits >= 4) {
      return true;
    }

    oldOffsetsByPartition = offsetsByPartition;
    await wait(1000);
  }

  return false;
};

export const quit = async () => {
  await admin.disconnect();
};
