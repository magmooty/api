import { apiWrapper, auth } from "@/components";
import {
  APIEndpoint,
  APINextFunction,
  APIRequest,
  APIResponse,
} from "@/api/types";
import { Context } from "@/tracing";

interface LoginEndpointBody {
  username: string;
  password: string;
}

export const loginEndpoint: APIEndpoint = apiWrapper(
  {
    name: "login",
    file: __filename,
  },
  async (ctx: Context, req: APIRequest, res: APIResponse) => {
    const { username, password }: LoginEndpointBody = req.body;

    const result = await auth.login(ctx, username, password);

    if (result) {
      res.json(result);
    }
  }
);
