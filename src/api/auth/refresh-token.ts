import { APIEndpoint, APIRequest, APIResponse } from "@/api/types";
import { apiWrapper, auth } from "@/components";
import { Context } from "@/tracing";
import { Record, Static, String } from "runtypes";
import { validateRequestBody } from "@/api/common";

const RefreshTokenBody = Record({
  refresh_token: String,
});

type RefreshTokenBody = Static<typeof RefreshTokenBody>;

export const refreshTokenEndpoint: APIEndpoint = apiWrapper(
  {
    name: "refreshToken",
    file: __filename,
  },
  async (ctx: Context, req: APIRequest, res: APIResponse) => {
    const { body } = req;

    await validateRequestBody(ctx, body, RefreshTokenBody);

    const { refresh_token }: RefreshTokenBody = body;

    const result = await auth.refreshToken(ctx, refresh_token);

    if (result) {
      res.json(result);
    }
  }
);
