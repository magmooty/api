import { User } from "@/graph/objects/types";
import { SearchDriver } from "@/search";
import { Context } from "@/tracing";
import { NativeAuthDriver, NativeAuthDriverConfig } from "./native";

export interface LoginResult {
  token: string;
  refresh_token: string;
}

export interface SessionSubstitute {
  roles: string[];
}

export interface TokenValidationResult {
  user: User;
  session: SessionSubstitute;
}

export interface AuthDriver {
  login(
    ctx: Context | null,
    username: string,
    password: string
  ): Promise<LoginResult | void>;

  signup(
    ctx: Context | null,
    username: string,
    password: string
  ): Promise<LoginResult | void>;

  refreshToken(
    ctx: Context | null,
    refreshToken: string
  ): Promise<void | LoginResult | void>;

  validateToken(
    ctx: Context | null,
    token: string
  ): Promise<void | TokenValidationResult>;
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
