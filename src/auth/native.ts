import { errors, persistence, wrapper } from "@/components";
import { Session, SystemUser, User } from "@/graph/objects/types";
import { serializeDate } from "@/persistence/commons/serialize-date";
import { SearchDriver } from "@/search";
import { Context } from "@/tracing";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import _ from "lodash";
import moment from "moment";
import kuuid from "kuuid";
import { AuthDriver, LoginResult } from ".";
import joi from "joi";
import joiPhoneNumber from "joi-phone-number";

const phoneNumberJoi = joi.extend(joiPhoneNumber);

const predictProvider = (username: string): "phone" | "email" | "unknown" => {
  const emailValidation = joi.string().email().validate(username);

  if (!emailValidation.error) {
    return "email";
  }

  const phoneValidation = phoneNumberJoi
    .string()
    .phoneNumber({ format: "international" })
    .validate(username);

  if (!phoneValidation.error) {
    return "phone";
  }

  return "unknown";
};

export interface NativeAuthDriverConfig {
  hashSaltLevel: number;
  sessionTTL: number;
  activeRefreshTokenSecret: string;
  deprecatedRefreshTokenSecrets: string[];
  refreshTokenTTL: number;
  passwordRegex: string;
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
      refreshToken?: string
    ): Promise<LoginResult> => {
      const sessionToken = kuuid.id();
      const sessionExpiresAt = moment()
        .add(this.nativeAuthDriverConfig.sessionTTL, "seconds")
        .toDate();

      const session = await persistence.createObject<Session>(ctx, {
        token: sessionToken,
        user: user.id,
        object_type: "session",
        roles: [],
        expiresAt: serializeDate(sessionExpiresAt),
      });

      const token = `${session.id}|${sessionToken}`;

      const refresh_token =
        refreshToken ||
        jwt.sign(
          {
            user: user.id,
            roles: [],
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
      password: string
    ): Promise<LoginResult | void> => {
      ctx.startTrackTime("login_requests_duration", "login_errors_duration");

      const predictedProvider = predictProvider(username);

      ctx.setErrorDurationMetricLabels({ provider: predictedProvider });

      if (predictedProvider === "unknown") {
        errors.createError(ctx, "InvalidUsername", {
          username,
          predictedProvider,
        });
        return;
      }

      const searchResult = await this.search.search(ctx, "user", {
        filters: { or: [{ email: username }, { phone: username }] },
      });

      if (!searchResult.length) {
        errors.createError(ctx, "UserNotFound", { username });
        return;
      }

      const user = await persistence.getObject<User>(ctx, searchResult[0]);

      if (user.email !== username && user.phone !== username) {
        errors.createError(ctx, "UserNotFound", { username });
        return;
      }

      if (user.email === username) {
        ctx.setParam("provider", "email");
      }

      if (user.phone === username) {
        ctx.setParam("provider", "phone");
      }

      ctx.setErrorDurationMetricLabels({ provider: ctx.getParam("provider") });
      ctx.setDurationMetricLabels({ provider: ctx.getParam("provider") });

      const systemUser = await persistence.getObject<SystemUser>(
        ctx,
        user.system_user as string
      );

      const hashMatches = bcrypt.compare(password, systemUser.hash);

      if (!hashMatches) {
        errors.createError(ctx, "WrongPassword", { username });
        return;
      }

      return this.createSession(ctx, user);
    },
    (ctx: Context, error: Error) => {
      ctx.metrics
        .getCounter("login_requests")
        .inc({ provider: ctx.getParam("provider"), error: error.message });
    },
    (ctx: Context) => {
      ctx.metrics
        .getCounter("login_requests")
        .inc({ provider: ctx.getParam("provider") });
    }
  );

  signup = wrapper(
    { name: "signup", file: __filename },
    async (
      ctx: Context,
      username: string,
      password: string
    ): Promise<LoginResult | void> => {
      ctx.register({ username });

      ctx.startTrackTime("signup_requests_duration", "signup_errors_duration");

      const predictedProvider = predictProvider(username);

      ctx.setDurationMetricLabels({ provider: predictedProvider });
      ctx.setErrorDurationMetricLabels({ provider: predictedProvider });

      ctx.setParam("provider", predictedProvider);

      ctx.log.info("Predicted provider", { username, predictedProvider });

      if (predictedProvider === "unknown") {
        errors.createError(ctx, "InvalidUsername", {
          username,
          predictedProvider,
        });
        return;
      }

      const passwordRegex = new RegExp(
        this.nativeAuthDriverConfig.passwordRegex
      );

      if (!passwordRegex.test(password)) {
        errors.createError(ctx, "InvalidPassword", { username });
        return;
      }

      const hash = await bcrypt.hash(
        password,
        this.nativeAuthDriverConfig.hashSaltLevel
      );

      const systemUser = await persistence.createObject<SystemUser>(ctx, {
        hash,
        object_type: "system-user",
      });

      const user = await persistence.createObject<User>(ctx, {
        [predictedProvider]: username,
        object_type: "user",
        system_user: systemUser.id,
      } as User);

      return this.createSession(ctx, user);
    },
    (ctx: Context, error: Error) => {
      ctx.metrics
        .getCounter("signup_errors")
        .inc({ provider: ctx.getParam("provider"), error: error.message });
    },
    (ctx: Context) => {
      ctx.metrics
        .getCounter("signup_requests")
        .inc({ provider: ctx.getParam("provider") });
    }
  );

  refreshToken = wrapper(
    { name: "refreshToken", file: __filename },
    async (ctx: Context, refreshToken: string): Promise<void | LoginResult> => {
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

      const user = await persistence.getObject<User>(ctx, decodedPayload.user);

      // if (!_.isEqual(extraAttributes.roles, decodedPayload.roles)) {
      //   errors.createError(ctx, "NeedToLoginAgain", {
      //     decodedPayload,
      //     extraAttributes,
      //   });
      //   return;
      // }

      return this.createSession(ctx, user, refreshToken);
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
