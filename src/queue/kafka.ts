import { wrapper } from "@/components";
import { GraphObject, IEdge } from "@/graph/objects/types";
import { Context } from "@/tracing";
import {
  Kafka,
  logLevel,
  Producer
} from "kafkajs";
import {
  BaseQueueEvent,
  QueueDriver,
  QueueEvent,
  QueueEventProcessor
} from ".";

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
  kafka?: Kafka;
  producer: Producer | null = null;
  topicsToConsumeFrom: QueueKafkaTopicConfig[];
  topicsToProduceTo: QueueKafkaTopicConfig[];

  constructor(private kafkaConfig: QueueKafkaConfig) {
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

      this.kafka = new Kafka({
        clientId: this.kafkaConfig.groupId,
        brokers: this.kafkaConfig.brokers,
        logCreator: () => (entry) => {
          switch (entry.level) {
            case logLevel.NOTHING:
            case logLevel.DEBUG:
            case logLevel.INFO:
              ctx.log.info(entry.log.message, { logger: "kafka" });
              break;
            case logLevel.WARN:
              ctx.log.warn(entry.log.message, { logger: "kafka" });
              break;
            case logLevel.ERROR:
              ctx.log.error(null, entry.log.message, { logger: "kafka" });
              break;
          }
        },
      });

      if (this.kafkaConfig.canProduce) {
        ctx.log.info("Connecting producer");
        this.producer = this.kafka.producer();
        await this.producer.connect();
        ctx.log.info("Producer connected");
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
    async <T = GraphObject | IEdge>(
      ctx: Context,
      event: BaseQueueEvent<T>
    ): Promise<void> => {
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

      const message = JSON.stringify({
        ...event,
        locale: ctx.traceInfo.locale,
        spanId: ctx.spanId,
        parentId: ctx.parentId,
        traceId: ctx.traceId,
      } as QueueEvent);

      ctx.log.info("Event body", { message });

      for (const topic of this.topicsToProduceTo) {
        ctx.log.info("Sending event", { topic });

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
      cb: QueueEventProcessor
    ): Promise<void> => {
      ctx.register({ groupId });

      if (!this.kafkaConfig.canConsume) {
        ctx.fatal("Service is not configured to consume events");
        return;
      }

      if (!this.kafka) {
        ctx.fatal("Kafka is not initialized yet");
        return;
      }

      ctx.log.info("Connecting consumer");

      const consumer = this.kafka.consumer({
        groupId,
      });

      await consumer.connect();

      ctx.log.info("Consumer connected");

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

            const event = JSON.parse(value) as QueueEvent;

            const { locale, spanId, traceId, parentId } = event;

            await cb(
              {
                traceInfo: { locale },
                spanId,
                traceId,
                parentId,
              },
              event
            );
          },
        });
      }
    }
  );
}
