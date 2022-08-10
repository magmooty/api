import { GraphObject, IEdge } from "@/graph/objects/types";
import { Context } from "@/tracing";
import { QueueKafkaConfig, QueueKafkaDriver } from "./kafka";

export interface QueueConfig {
  driver: "kafka";
  config: QueueKafkaConfig;
}

export interface QueueDriver {
  init(ctx?: Context | null): Promise<void>;
  send(ctx: Context | null, message: QueueEvent): Promise<void>;
  subscribe(
    ctx: Context | null,
    groupId: string,
    callback: QueueEventProcessor
  ): Promise<void>;
}

export interface QueueEvent {
  method: "POST" | "PATCH" | "DELETE";
  type: "edge" | "object";
  path: string;
  previous?: GraphObject | IEdge;
  current?: GraphObject | IEdge;
}

export type QueueEventProcessor = (event: QueueEvent) => Promise<void>;

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
