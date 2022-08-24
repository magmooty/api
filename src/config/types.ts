import { AuthConfig } from "@/auth";
import { AppLocale } from "@/graph/objects/types";
import { PersistenceConfig } from "@/persistence";
import { QueueConfig } from "@/queue";
import { SearchConfig } from "@/search";
import { TwilioConfig } from "@/services/twilio";
import { SyncConfig } from "@/sync";

export interface AppConfig {
  $schema?: string;
  server: {
    port: number;
  };
  auth: AuthConfig;
  persistence: PersistenceConfig;
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
}
