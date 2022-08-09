import { Context } from "@/tracing";
import { QueueKafkaConfig, QueueKafkaDriver } from "./kafka";

export interface QueueConfig {
  driver: "kafka";
  config: QueueKafkaConfig;
}

export interface QueueDriver {
  init(ctx?: Context | null): Promise<void>;
  send(ctx: Context | null, message: string): Promise<void>;
}

export const createQueueDriver = ({
  driver,
  config,
}: QueueConfig): QueueDriver => {
  switch (driver) {
    case "kafka":
      return new QueueKafkaDriver(config);
    default:
      throw new Error(
        "Couldn't create queue driver for driver with current config"
      );
  }
};
