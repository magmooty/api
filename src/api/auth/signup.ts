import { apiWrapper, auth } from "@/components";
import {
  APIEndpoint,
  APINextFunction,
  APIRequest,
  APIResponse,
} from "@/api/types";
import { Context } from "@/tracing";

interface SignupEndpointBody {
  username: string;
  password: string;
}

export const signupEndpoint: APIEndpoint = apiWrapper(
  {
    name: "signup",
    file: __filename,
  },
  async (ctx: Context, req: APIRequest, res: APIResponse) => {
    const { username, password }: SignupEndpointBody = req.body;

    const result = await auth.signup(ctx, username, password);

    if (result) {
      res.json(result);
    }
  }
);
