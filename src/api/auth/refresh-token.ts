import { apiWrapper, auth } from "@/components";
import {
  APIEndpoint,
  APINextFunction,
  APIRequest,
  APIResponse,
} from "@/api/types";
import { Context } from "@/tracing";

interface RefreshTokenBody {
  refresh_token: string;
}

export const refreshTokenEndpoint: APIEndpoint = apiWrapper(
  {
    name: "refreshToken",
    file: __filename,
  },
  async (ctx: Context, req: APIRequest, res: APIResponse) => {
    const { refresh_token }: RefreshTokenBody = req.body;

    const result = await auth.refreshToken(ctx, refresh_token);

    if (result) {
      res.json(result);
    }
  }
);
