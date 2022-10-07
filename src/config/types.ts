import { APIConfig, ServerConfig } from "@/api";
import { AuthConfig } from "@/auth";
import { AppLocale } from "@/graph/objects/types";
import { ParallelLogicConfig } from "@/parallel-logic";
import { PersistenceConfig } from "@/persistence";
import { QueueConfig } from "@/queue";
import { SearchConfig } from "@/search";
import { TwilioConfig } from "@/services/twilio";
import { SyncConfig } from "@/sync";

export interface AppConfig {
  $schema?: string;
  env: string;
  server: ServerConfig;
  auth: AuthConfig;
  persistence: PersistenceConfig;
  api: APIConfig;
  i18n: {
    defaultLocale: AppLocale;
    locales: AppLocale[];
  };
  queue: QueueConfig;
  sync: SyncConfig;
  search: SearchConfig;
  services: {
    twilio: TwilioConfig;
  };
  parallelLogic: ParallelLogicConfig;
  processEnv?: { [key: string]: string };
}
