import { AppLocale, GraphObject, IEdge } from "@/graph/objects/types";
import { Context, RootContext } from "@/tracing";
import { QueueKafkaConfig, QueueKafkaDriver } from "./kafka";

export interface QueueConfig {
  driver: "kafka";
  config: QueueKafkaConfig;
}

export interface QueueDriver {
  init(ctx?: Context | null): Promise<void>;
  send<T = GraphObject | IEdge>(
    ctx: Context | null,
    message: BaseQueueEvent<T>
  ): Promise<void>;
  subscribe(
    ctx: Context | null,
    groupId: string,
    callback: QueueEventProcessor
  ): Promise<void>;
}

export interface BaseQueueEvent<T = GraphObject | IEdge> {
  method: "POST" | "PATCH" | "DELETE";
  type: "edge" | "object";
  path: string;
  previous?: T;
  current?: T;
}

export interface QueueEvent<T = GraphObject | IEdge> extends BaseQueueEvent<T> {
  method: "POST" | "PATCH" | "DELETE";
  type: "edge" | "object";
  path: string;
  previous?: T;
  current?: T;
  spanId: string;
  parentId: string;
  traceId: string;
  locale: AppLocale;
}

export type QueueEventProcessor = (
  ctx: RootContext | null,
  event: QueueEvent
) => Promise<void>;

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
