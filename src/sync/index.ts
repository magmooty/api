import { ObjectType } from "@/graph/objects/types";
import { QueueEvent } from "@/queue";
import { Context } from "@/tracing";
import {
  ElasticSearchSyncConfig,
  ElasticSearchSyncDriver,
} from "./elasticsearch";

export interface SyncConfig {
  driver: "elasticsearch";
  config: ElasticSearchSyncConfig;
}

export interface SyncDriver {
  init(ctx?: Context | null, seedMode?: boolean): Promise<void>;
  processEvent(ctx: Context | null, event: QueueEvent): Promise<void>;
  reseedObject(
    ctx: Context | null,
    objectType: ObjectType,
    after?: string | null,
    completeRecreation?: boolean
  ): Promise<void>;
  clearDBForTest(ctx?: Context | null): Promise<void>;
  quit(): Promise<void>;
}

export const createSyncDriver = ({
  driver,
  config,
}: SyncConfig): SyncDriver | void => {
  switch (driver) {
    case "elasticsearch":
      return new ElasticSearchSyncDriver(config);
    default:
      throw new Error(
        "Couldn't create sync driver because this driver doesn't exist"
      );
  }
};
