import { Context } from "@/tracing";

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
