import { SearchDriver } from "@/search";
import { Context } from "@/tracing";
import { NativeAuthDriver, NativeAuthDriverConfig } from "./native";

export interface SessionExtraAttirbutes {
  roles: string[];
}

export interface LoginResult {
  token: string;
  refresh_token: string;
}

export interface AuthDriver {
  login(
    ctx: Context | null,
    username: string,
    password: string,
    extraAttributes: SessionExtraAttirbutes
  ): Promise<LoginResult>;

  register(
    ctx: Context | null,
    username: string,
    password: string,
    extraAttributes: SessionExtraAttirbutes
  ): Promise<LoginResult>;
}

export interface AuthConfig {
  driver: "native";
  config: NativeAuthDriverConfig;
}

export const createAuthDriver = (
  { driver, config }: AuthConfig,
  search: SearchDriver
) => {
  switch (driver) {
    case "native":
      return new NativeAuthDriver(config, search);
  }
};
