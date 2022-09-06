import {
  APIEndpoint,
  APINextFunction,
  APIRequest,
  APIResponse,
} from "@/api/types";
import { auth, errors, apiWrapper } from "@/components";
import { Context } from "@/tracing";

export const authMiddleware: APIEndpoint = apiWrapper(
  { name: "authMiddleware", file: __filename },
  async (
    ctx: Context,
    req: APIRequest,
    _: APIResponse,
    next: APINextFunction
  ) => {
    const { authorization } = req.headers;

    if (!authorization) {
      errors.createError(ctx, "InvalidToken");
      return;
    }

    const token = authorization.slice("Bearer ".length);

    const validationResult = await auth.validateToken(ctx, token);

    if (!validationResult) {
      errors.createError(ctx, "SessionExpired");
      return;
    }

    const { user, session } = validationResult;

    ctx.log.info("request for user session", { user, session });

    req.user = user;
    req.session = session;
    next();
  }
);
