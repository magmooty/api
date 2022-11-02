import { errors, persistence, wrapper } from "@/components";
import { Session, SystemUser, User, UserRole } from "@/graph/objects/types";
import { serializeDate } from "@/persistence/commons/serialize-date";
import { SearchDriver } from "@/search";
import { Context } from "@/tracing";
import bcrypt from "bcryptjs";
import joi from "joi";
import joiPhoneNumber from "joi-phone-number";
import jwt from "jsonwebtoken";
import kuuid from "kuuid";
import _ from "lodash";
import moment from "moment";
import { AuthDriver, LoginResult, TokenValidationResult } from ".";

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
  devRoleUsernames: string[];
}

export interface RefreshTokenPayload {
  roles: string[];
  user: string;
}

const extractRoles = (role: UserRole): string[] => {
  switch (role.object_type) {
    case "tutor_role":
      return [
        "tutor_role",
        `${role.id}|${role.user}|${role.space}|space_admin`,
      ];
    case "student_role":
      return [
        "student_role",
        `${role.id}|${role.user}|${role.space}|space_student`,
      ];
    case "assistant_role":
      return [
        "assistant_role",
        ...role.permissions.map(
          (permission) => `${role.id}|${role.user}|${role.space}|${permission}`
        ),
      ];
    default:
      return [];
  }
};

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

      const systemUser = await persistence.updateObject<SystemUser>(
        ctx,
        user.system_user,
        { last_session_id: "+1" },
        { author: user.id }
      );

      const rolesObjects = await persistence.getEdges<UserRole[]>(
        ctx,
        user.id,
        "roles"
      );

      const roles = _.flatten(rolesObjects.map(extractRoles));

      if (
        this.nativeAuthDriverConfig.devRoleUsernames.find((devRoleUsername) =>
          new RegExp(devRoleUsername).test(user.email)
        )
      ) {
        roles.push("dev-role");
      }

      const session = await persistence.createObject<Session>(ctx, {
        token: sessionToken,
        user: user.id,
        session_id: systemUser.last_session_id,
        object_type: "session",
        roles,
        expiresAt: serializeDate(sessionExpiresAt),
      });

      const token = `${session.id}|${sessionToken}`;

      const refresh_token =
        refreshToken ||
        jwt.sign(
          {
            user: user.id,
            roles,
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

      const { results: searchResult } = await this.search.search<User>(
        ctx,
        "user",
        {
          filters: { or: [{ email: username }, { phone: username }] },
        }
      );

      if (!searchResult.length) {
        errors.createError(ctx, "UserNotFound", { username });
        return;
      }

      const user = searchResult[0];

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

      const hashMatches = await bcrypt.compare(password, systemUser.hash);

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
        object_type: "system_user",
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

      return this.createSession(ctx, user, refreshToken);
    }
  );

  validateToken = wrapper(
    { name: "validateToken", file: __filename },
    async (
      ctx: Context,
      token: string
    ): Promise<TokenValidationResult | void> => {
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

      const user = await persistence.getObject<User>(
        ctx,
        session.user as string
      );

      const systemUser = await persistence.getObject<SystemUser>(
        ctx,
        user.system_user
      );

      if (systemUser.last_acceptable_session_id > session.session_id) {
        errors.createError(ctx, "SessionExpired", { sessionId });
        return;
      }

      return { user, session };
    }
  );
}
