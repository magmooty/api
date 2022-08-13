import config from "@/config";
import { Kafka } from "kafkajs";
import yargs from "yargs/yargs";
import { hideBin } from "yargs/helpers";

async function main() {
  const argv: any = yargs(process.argv).argv;

  if (!argv.topic) {
    return console.error("You need to define a topic");
  }

  if (!argv.group) {
    return console.error("You need to define a group");
  }
  const { config: kafkaConfig, driver } = config.queue;

  if (driver !== "kafka") {
    return console.error("This script only works for Kafka");
  }

  const { brokers } = kafkaConfig;

  if (!brokers || !brokers.length) {
    return console.error("There are no brokers configured");
  }

  const kafka = new Kafka({
    brokers: brokers,
  });

  const admin = kafka.admin();

  await admin.connect();

  await admin.resetOffsets({
    topic: argv.topic,
    groupId: argv.group,
    earliest: false,
  });

  await admin.disconnect();
}

main();
