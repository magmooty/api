import { errors, persistence, wrapper } from "@/components";
import { SearchDriver } from "@/search";
import { Context } from "@/tracing";
import { User } from "@/graph/objects/types";
import { AuthDriver, LoginResult, SessionExtraAttirbutes } from ".";
import bcrypt from "bcryptjs";

export interface NativeAuthDriverConfig {
  hashSaltLevel: number;
  sessionTTL: number;
}

export class NativeAuthDriver implements AuthDriver {
  constructor(
    private nativeAuthDriverConfig: NativeAuthDriverConfig,
    private search: SearchDriver
  ) {}

  login = wrapper(
    { name: "login", file: __filename },
    async (
      ctx: Context,
      username: string,
      password: string,
      extraAttributes: SessionExtraAttirbutes
    ): Promise<LoginResult> => {
      const result = await this.search.search(ctx, "user", {
        filters: { and: [{ email: username }] },
      });

      if (!result.length) {
        errors.createError(ctx, "UserNotFound", { username });
      }

      const user = await persistence.getObject<User>(ctx, result[0]);

      if (user.email !== username) {
        errors.createError(ctx, "UserNotFound", { username });
      }

      return {} as any;
    }
  );

  register = wrapper(
    { name: "register", file: __filename },
    async (
      ctx: Context,
      email: string,
      password: string,
      extraAttributes: SessionExtraAttirbutes
    ): Promise<LoginResult> => {
      const hash = await bcrypt.hash(
        password,
        this.nativeAuthDriverConfig.hashSaltLevel
      );

      await persistence.createObject<User>(null, {
        email,
        object_type: "user",
        hash,
      } as User);

      return {} as any;
    }
  );
}
