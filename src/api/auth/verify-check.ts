import { validateRequestBody } from "@/api/common";
import { APIEndpoint, APIRequest, APIResponse } from "@/api/types";
import { apiWrapper, errors, persistence, services } from "@/components";
import { Context } from "@/tracing";
import { Record, Static, String, Union, Literal } from "runtypes";

const VerifyCheckEndpointBody = Record({
  channel: Union(Literal("sms"), Literal("email")),
  code: String,
});

type VerifyCheckEndpointBody = Static<typeof VerifyCheckEndpointBody>;

export const verifyCheckEndpoint: APIEndpoint = apiWrapper(
  {
    name: "verify-check",
    file: __filename,
  },
  async (ctx: Context, req: APIRequest, res: APIResponse) => {
    const { body } = req;

    await validateRequestBody(ctx, body, VerifyCheckEndpointBody);

    const { channel, code }: VerifyCheckEndpointBody = req.body;

    ctx.register({ channel, code });

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

    const to = { sms: phone, email }[channel];

    const verificationCheckInstance = await services.twilio.checkVerification(
      ctx,
      to,
      code
    );

    if (verificationCheckInstance.status === "approved") {
      switch (verificationCheckInstance.channel) {
        case "email":
          await persistence.updateObject(ctx, req.user.id, {
            email_verified: true,
          });
          return res.json({ ...req.user, email_verified: true });
        case "sms":
          await persistence.updateObject(ctx, req.user.id, {
            phone_verified: true,
          });
          return res.json({ ...req.user, phone_verified: true });
      }
    }

    // If failed or channel not supported
    errors.createError(ctx, "VerificationFailed", {
      to,
      channel,
      code,
      phone,
      email,
    });
    return;
  }
);
