import { APIEndpoint, APIRequest, APIResponse } from "@/api/types";
import { apiWrapper } from "@/components";
import { Context } from "@/tracing";

interface VerifyStartEndpointBody {
  channel: "email" | "phone";
}

export const verifyStartEndpoint: APIEndpoint = apiWrapper(
  {
    name: "verify-start",
    file: __filename,
  },
  async (ctx: Context, req: APIRequest, res: APIResponse) => {
    const { channel }: VerifyStartEndpointBody = req.body;

    ctx.register({ channel });

    if (!req.user) {
      return;
    }

    const { phone, email } = req.user;

    if (channel === "email" && !email) {
      
    }

    res.status(200).send();
  }
);
