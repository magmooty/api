import { wrapper } from "@/components";
import { Context } from "@/tracing";
import { Consumer, EachMessageHandler, Kafka, Producer } from "kafkajs";
import { v4 as uuid } from "uuid";
import { QueueDriver, QueueEvent, QueueEventProcessor } from ".";

export enum QueueKafkaTopicUse {
  Pushing = "pushing",
  Events = "events",
}

export interface QueueKafkaTopicConfig {
  use: QueueKafkaTopicUse;
  name: string;
}

export interface QueueKafkaConfig {
  brokers: string[];
  canProduce: boolean;
  canConsume: boolean;
  groupId?: string;
  topics: QueueKafkaTopicConfig[];
}

export class QueueKafkaDriver implements QueueDriver {
  kafka: Kafka;
  producer: Producer | null = null;
  topicsToConsumeFrom: QueueKafkaTopicConfig[];
  topicsToProduceTo: QueueKafkaTopicConfig[];

  constructor(private kafkaConfig: QueueKafkaConfig) {
    this.kafka = new Kafka({
      clientId: kafkaConfig.groupId,
      brokers: kafkaConfig.brokers,
    });

    this.topicsToProduceTo = this.kafkaConfig.topics.filter(
      (topic) => topic.use === QueueKafkaTopicUse.Pushing
    );

    this.topicsToConsumeFrom = this.kafkaConfig.topics.filter(
      (topic) => topic.use === QueueKafkaTopicUse.Events
    );
  }

  init = wrapper(
    { name: "init", file: __filename },
    async (ctx: Context): Promise<void> => {
      ctx.register({ kafkaConfig: this.kafkaConfig });

      if (this.kafkaConfig.canProduce) {
        ctx.log.debug("Connecting producer");
        this.producer = this.kafka.producer();
        await this.producer.connect();
        ctx.log.debug("Producer connected");
      }

      if (this.topicsToConsumeFrom.length && !this.kafkaConfig.canConsume) {
        ctx.fatal(
          "Service is configured to listen on topics, but the consumer isn't configured properly"
        );
      }
    }
  );

  send = wrapper(
    { name: "send", file: __filename },
    async (ctx: Context, event: QueueEvent): Promise<void> => {
      if (!this.producer) {
        ctx.fatal(
          "No producer is configured, but the service is trying to send a message"
        );
        return;
      }

      if (!this.topicsToProduceTo.length) {
        ctx.fatal("No topics are configured to produce to");
        return;
      }

      const message = JSON.stringify(event);

      ctx.log.debug("Event body", { message });

      for (const topic of this.topicsToProduceTo) {
        ctx.log.debug("Sending event", { topic });

        this.producer.send({
          topic: topic.name,
          messages: [{ value: message }],
        });
      }
    }
  );

  subscribe = wrapper(
    { name: "subscribe", file: __filename },
    async (
      ctx: Context,
      groupId: string,
      callback: QueueEventProcessor
    ): Promise<void> => {
      if (!this.kafkaConfig.canConsume) {
        ctx.fatal("Service is not configured to consume events");
        return;
      }

      ctx.log.debug("Connecting consumer");

      const consumer = this.kafka.consumer({
        groupId,
      });

      await consumer.connect();

      ctx.log.debug("Consumer connected");

      for (const topic of this.topicsToConsumeFrom) {
        await consumer?.subscribe({ topic: topic.name });
      }

      if (consumer) {
        await consumer.run({
          autoCommit: true,
          eachMessage: async ({ message }) => {
            const value = message.value?.toString();

            if (!value) {
              console.error("Failed to parse kafka message", message);
              process.exit();
            }

            console.log(value);

            callback(JSON.parse(value) as QueueEvent);
          },
        });
      }
    }
  );
}
