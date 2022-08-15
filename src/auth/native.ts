import { wrapper } from "@/components";
import { SearchDriver } from "@/search";
import { Context } from "@/tracing";
import { AuthDriver, LoginResult, SessionExtraAttirbutes } from ".";

export interface NativeAuthDriverConfig {
  sessionTTL: number;
}

export class NativeAuthDriver implements AuthDriver {
  constructor(private search: SearchDriver) {}

  login = wrapper(
    { name: "login", file: __filename },
    async (
      ctx: Context,
      username: string,
      password: string,
      extraAttributes: SessionExtraAttirbutes
    ): Promise<LoginResult> => {
      // await this.search.search(ctx, "user", { filters: { email: username } });

      return {} as any;
    }
  );

  register = wrapper(
    { name: "register", file: __filename },
    (
      ctx: Context | null,
      username: string,
      password: string,
      extraAttributes: SessionExtraAttirbutes
    ): Promise<LoginResult> => {
      return {} as any;
    }
  );
}
