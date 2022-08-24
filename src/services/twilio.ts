import { wrapper } from "@/components";
import config from "@/config";
import { Context } from "@/tracing";
import createTwilio from "twilio";

export interface TwilioConfig {
  accountSid: string;
  authToken: string;
  verificationService: string;
}

export type TwilioChannel = "email" | "sms";

export type TwilioVerificationStatus = "pending" | "approved";

class TwilioService {
  twilioConfig: TwilioConfig;
  client;

  constructor() {
    this.twilioConfig = config.services.twilio;

    const { accountSid, authToken } = this.twilioConfig;

    this.client = createTwilio(accountSid, authToken);
  }

  startVerification = wrapper(
    { name: "startVerification", file: __filename },
    async (
      ctx: Context,
      to: string,
      channel: TwilioChannel
    ): Promise<TwilioVerificationStatus> => {
      ctx.register({ to, channel });

      const verification = await this.client.verify.v2
        .services(this.twilioConfig.verificationService)
        .verifications.create({ to, channel });

      return verification.status as TwilioVerificationStatus;
    }
  );

  checkVerification = wrapper(
    { name: "checkVerification", file: __filename },
    async (
      ctx: Context,
      to: string,
      code: string
    ): Promise<TwilioVerificationStatus> => {
      ctx.register({ to, code });

      const verification = await this.client.verify.v2
        .services(this.twilioConfig.verificationService)
        .verificationChecks.create({ to, code });

      return verification.status as TwilioVerificationStatus;
    }
  );
}

export const twilio = new TwilioService();
