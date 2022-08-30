import { wrapper } from "@/components";
import config from "@/config";
import { Context } from "@/tracing";
import createTwilio from "twilio";
import { VerificationInstance } from "twilio/lib/rest/verify/v2/service/verification";
import { VerificationCheckInstance } from "twilio/lib/rest/verify/v2/service/verificationCheck";

export interface TwilioConfig {
  accountSid: string;
  authToken: string;
  verificationService: string;
}

export type TwilioChannel = "email" | "sms";

export type TwilioVerificationStatus = "pending" | "approved";

class TwilioService {
  private twilioConfig: TwilioConfig;
  private client;

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
    ): Promise<VerificationInstance> => {
      ctx.register({ to, channel });

      const verification = await this.client.verify.v2
        .services(this.twilioConfig.verificationService)
        .verifications.create({ to, channel });

      return verification;
    }
  );

  checkVerification = wrapper(
    { name: "checkVerification", file: __filename },
    async (
      ctx: Context,
      to: string,
      code: string
    ): Promise<VerificationCheckInstance> => {
      ctx.register({ to, code });

      const verification = await this.client.verify.v2
        .services(this.twilioConfig.verificationService)
        .verificationChecks.create({ to, code });

      return verification;
    }
  );
}

export const twilio = new TwilioService();
