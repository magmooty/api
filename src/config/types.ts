import { NativeAuthDriverConfig } from "@/auth/native";
import { AppLocale } from "@/graph/objects/types";
import { PersistenceConfig } from "@/persistence";
import { QueueConfig } from "@/queue";
import { SearchConfig } from "@/search";
import { SyncConfig } from "@/sync";

export interface AppConfig {
  $schema?: string;
  server: {
    port: number;
  };
  auth: ;
  persistence: PersistenceConfig;
  i18n: {
    defaultLocale: AppLocale;
    locales: AppLocale[];
  };
  queue: QueueConfig;
  sync: SyncConfig;
  search: SearchConfig;
}
