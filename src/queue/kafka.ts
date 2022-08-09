import { wrapper } from "@/components";
import { Context } from "@/tracing";
import { Consumer, Kafka, Producer } from "kafkajs";
import { v4 as uuid } from "uuid";
import { QueueDriver } from ".";

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
  consumer: Consumer | null = null;
  topicsToConsumeFrom: QueueKafkaTopicConfig[];
  topicsToProduceTo: QueueKafkaTopicConfig[];

  constructor(private kafkaConfig: QueueKafkaConfig) {
    this.kafka = new Kafka({
      clientId: `${kafkaConfig.groupId}-${uuid()}`,
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

      if (this.kafkaConfig.canConsume && !this.kafkaConfig.groupId) {
        ctx.fatal(
          "Service is configured to consume from kafka, but no group id is specified in config"
        );
      }

      if (this.kafkaConfig.canConsume && this.kafkaConfig.groupId) {
        ctx.log.debug("Connecting consumer");
        this.consumer = this.kafka.consumer({
          groupId: this.kafkaConfig.groupId,
        });
        await this.consumer.connect();
        ctx.log.debug("Consumer connected");
      }

      if (this.topicsToConsumeFrom.length && !this.consumer) {
        ctx.fatal(
          "Service is configured to listen on topics, but the consumer isn't configured properly"
        );
      }

      for (const topic of this.topicsToConsumeFrom) {
        await this.consumer?.subscribe({ topic: topic.name });
      }

      if (this.consumer) {
        await this.consumer.run({
          eachMessage: async ({ topic, partition, message }) => {
            console.log({
              topic,
              partition,
              message,
            });
          },
        });
      }
    }
  );

  send = wrapper(
    { name: "send", file: __filename },
    async (ctx: Context, message: string): Promise<void> => {
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

      for (const topic of this.topicsToProduceTo) {
        this.producer.send({
          topic: topic.name,
          messages: [{ value: message }],
        });
      }
    }
  );

  subscribe = wrapper(
    { name: "subscribe", file: __filename },
    (ctx: Context, path: string) => {}
  );
}
