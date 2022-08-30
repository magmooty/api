import { validateRequestBody } from "@/api/common";
import { APIEndpoint, APIRequest, APIResponse } from "@/api/types";
import { apiWrapper, errors, services } from "@/components";
import { Context } from "@/tracing";
import { Literal, Record, Static, Union } from "runtypes";

const VerifyStartEndpointBody = Record({
  channel: Union(Literal("sms"), Literal("email")),
});

type VerifyStartEndpointBody = Static<typeof VerifyStartEndpointBody>;

export const verifyStartEndpoint: APIEndpoint = apiWrapper(
  {
    name: "verify-start",
    file: __filename,
  },
  async (ctx: Context, req: APIRequest, res: APIResponse) => {
    const { body } = req;

    await validateRequestBody(ctx, body, VerifyStartEndpointBody);

    const { channel }: VerifyStartEndpointBody = body;

    ctx.register({ channel });

    if (!req.user) {
      return;
    }

    const { phone, email } = req.user;

    if (channel === "email" && !email) {
      errors.createError(ctx, "InvalidVerificationChannelEmail", {
        user: req.user,
        channel,
      });
      return;
    }

    if (channel === "sms" && !phone) {
      errors.createError(ctx, "InvalidVerificationChannelSMS", {
        user: req.user,
        channel,
      });
      return;
    }

    if (channel === "sms") {
      await services.twilio.startVerification(ctx, phone, "sms");
    }

    res.status(200).send();
  }
);
