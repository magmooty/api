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

    const user = await auth.validateToken(ctx, token);

    if (!user) {
      errors.createError(ctx, "SessionExpired");
      return;
    }

    req.user = user;
    next();
  }
);
