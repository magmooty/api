import { errors, persistence, wrapper } from "@/components";
import { SearchDriver } from "@/search";
import { Context } from "@/tracing";
import { Session, User } from "@/graph/objects/types";
import { AuthDriver, LoginResult, SessionExtraAttirbutes } from ".";
import bcrypt from "bcryptjs";
import { v4 as uuid } from "uuid";
import { serializeDate } from "@/persistence/commons/serialize-date";
import moment from "moment";
import jwt from "jsonwebtoken";
import _ from "lodash";

export interface NativeAuthDriverConfig {
  hashSaltLevel: number;
  sessionTTL: number;
  activeRefreshTokenSecret: string;
  deprecatedRefreshTokenSecrets: string[];
  refreshTokenTTL: number;
}

export interface RefreshTokenPayload {
  roles: string[];
  user: string;
}

export class NativeAuthDriver implements AuthDriver {
  constructor(
    private nativeAuthDriverConfig: NativeAuthDriverConfig,
    private search: SearchDriver
  ) {}

  private createSession = wrapper(
    { name: "createSession", file: __filename },
    async (
      ctx: Context,
      user: User,
      extraAttributes: SessionExtraAttirbutes,
      refreshToken?: string
    ): Promise<LoginResult> => {
      const sessionToken = uuid();
      const sessionExpiresAt = moment()
        .add(this.nativeAuthDriverConfig.sessionTTL, "seconds")
        .toDate();

      const session = await persistence.createObject<Session>(ctx, {
        token: sessionToken,
        user: user.id,
        object_type: "session",
        roles: extraAttributes.roles,
        expiresAt: serializeDate(sessionExpiresAt),
      });

      const token = `${session.id}|${sessionToken}`;

      const refresh_token =
        refreshToken ||
        jwt.sign(
          {
            user: user.id,
            roles: extraAttributes.roles,
          } as RefreshTokenPayload,
          this.nativeAuthDriverConfig.activeRefreshTokenSecret,
          { expiresIn: this.nativeAuthDriverConfig.refreshTokenTTL }
        );

      return { token, refresh_token };
    }
  );

  login = wrapper(
    { name: "login", file: __filename },
    async (
      ctx: Context,
      username: string,
      password: string,
      extraAttributes: SessionExtraAttirbutes
    ): Promise<LoginResult | void> => {
      const searchResult = await this.search.search(ctx, "user", {
        filters: { and: [{ email: username }] },
      });

      if (!searchResult.length) {
        errors.createError(ctx, "UserNotFound", { username });
      }

      const user = await persistence.getObject<User>(ctx, searchResult[0]);

      if (user.email !== username) {
        errors.createError(ctx, "UserNotFound", { username });
        return;
      }

      const hashMatches = bcrypt.compare(password, user.hash);

      if (!hashMatches) {
        errors.createError(ctx, "WrongPassword", { username });
        return;
      }

      return this.createSession(ctx, user, extraAttributes);
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
      ctx.register({ email });

      const hash = await bcrypt.hash(
        password,
        this.nativeAuthDriverConfig.hashSaltLevel
      );

      const user = await persistence.createObject<User>(null, {
        email,
        object_type: "user",
        hash,
      } as User);

      return this.createSession(ctx, user, extraAttributes);
    }
  );

  refreshToken = wrapper(
    { name: "refreshToken", file: __filename },
    async (
      ctx: Context,
      refreshToken: string,
      extraAttributes: SessionExtraAttirbutes
    ): Promise<void | LoginResult> => {
      const decodedPayload = jwt.decode(refreshToken) as RefreshTokenPayload;

      ctx.register({ decodedPayload });

      if (!decodedPayload) {
        errors.createError(ctx, "InvalidToken", { decodedPayload });
        return;
      }

      const verified = jwt.verify(
        refreshToken,
        this.nativeAuthDriverConfig.activeRefreshTokenSecret
      );

      if (!verified) {
        errors.createError(ctx, "InvalidToken", { decodedPayload });
        return;
      }

      if (!_.isEqual(extraAttributes.roles, decodedPayload.roles)) {
        errors.createError(ctx, "NeedToLoginAgain", {
          decodedPayload,
          extraAttributes,
        });
        return;
      }

      const user = await persistence.getObject<User>(ctx, decodedPayload.user);

      return this.createSession(ctx, user, extraAttributes, refreshToken);
    }
  );

  validateToken = wrapper(
    { name: "validateToken", file: __filename },
    async (ctx: Context, token: string): Promise<User | void> => {
      if (!token) {
        errors.createError(ctx, "InvalidToken");
        return;
      }

      const [sessionId, sessionToken] = token.split("|");

      if (!sessionId || !sessionToken) {
        errors.createError(ctx, "InvalidToken", { sessionId });
      }

      const session = await persistence.getObject<Session>(ctx, sessionId);

      if (!session) {
        errors.createError(ctx, "SessionExpired", { sessionId });
        return;
      }

      if (new Date(session.expiresAt) <= new Date()) {
        errors.createError(ctx, "SessionExpired", {
          sessionId,
          expiresAt: session.expiresAt,
        });
        return;
      }

      return persistence.getObject<User>(ctx, session.user as string);
    }
  );
}
