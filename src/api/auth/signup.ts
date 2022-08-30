import { APIEndpoint, APIRequest, APIResponse } from "@/api/types";
import { apiWrapper, auth } from "@/components";
import { Context } from "@/tracing";
import { Record, Static, String } from "runtypes";
import { validateRequestBody } from "@/api/common";

const SignupEndpointBody = Record({
  username: String,
  password: String,
});

type SignupEndpointBody = Static<typeof SignupEndpointBody>;

export const signupEndpoint: APIEndpoint = apiWrapper(
  {
    name: "signup",
    file: __filename,
  },
  async (ctx: Context, req: APIRequest, res: APIResponse) => {
    const { body } = req;

    await validateRequestBody(ctx, body, SignupEndpointBody);

    const { username, password }: SignupEndpointBody = body;

    const result = await auth.signup(ctx, username, password);

    if (result) {
      res.json(result);
    }
  }
);
