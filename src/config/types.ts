import { CognitoConfig } from "@/auth/cognito";
import { AppLocale } from "@/graph/objects/types";
import { PersistenceConfig } from "@/persistence";

export interface AppConfig {
  $schema?: string;
  server: {
    port: number;
  };
  auth: {
    driver: "cognito";
    config: CognitoConfig;
  };
  persistence: PersistenceConfig;
  i18n: {
    defaultLocale: AppLocale;
    locales: AppLocale[];
  };
}
