import { NativeAuthDriverConfig } from "@/auth/native";
import { AppLocale } from "@/graph/objects/types";
import { PersistenceConfig } from "@/persistence";
import { QueueConfig } from "@/queue";
import { SyncConfig } from "@/sync";

export interface AppConfig {
  $schema?: string;
  server: {
    port: number;
  };
  auth: {
    driver: "native";
    config: NativeAuthDriverConfig;
  };
  persistence: PersistenceConfig;
  i18n: {
    defaultLocale: AppLocale;
    locales: AppLocale[];
  };
  queue: QueueConfig;
  sync: SyncConfig;
}
