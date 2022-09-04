import { APIEndpoint, APIRequest, APIResponse } from "@/api/types";
import { apiWrapper, auth } from "@/components";
import { Context } from "@/tracing";
import { Record, Static, String } from "runtypes";
import { validateRequestBody } from "../common";

const LoginEndpointBody = Record({
  username: String,
  password: String,
});

type LoginEndpointBody = Static<typeof LoginEndpointBody>;

export const loginEndpoint: APIEndpoint = apiWrapper(
  {
    name: "login",
    file: __filename,
  },
  async (ctx: Context, req: APIRequest, res: APIResponse) => {
    const { body } = req;

    await validateRequestBody(ctx, body, LoginEndpointBody);

    const { username, password }: LoginEndpointBody = body;

    const result = await auth.login(ctx, username, password);

    if (result) {
      res.json(result);
    }
  }
);
