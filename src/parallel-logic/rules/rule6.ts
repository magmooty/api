import { persistence, search, wrapper } from "@/components";
import { Notification, NotificationTypeVS, User } from "@/graph/objects/types";
import { QueueEvent } from "@/queue";
import { Context } from "@/tracing";

export const rule6 = wrapper(
  { name: "rule6", file: __filename },
  async (ctx: Context, event: QueueEvent<User>) => {
    if (event.current?.email_verified && !event.previous?.email_verified) {
      const [verifyEmailNotification] = await search.search<Notification>(
        ctx,
        "notification",
        {
          filters: {
            and: [
              {
                user: event.current.id,
              },
              { type: "verify_email" as NotificationTypeVS },
            ],
          },
          sort_by: { created_at: "desc" },
        }
      );

      if (
        verifyEmailNotification &&
        verifyEmailNotification.data &&
        verifyPhoneNotification.data.completed === false &&
        verifyEmailNotification.data.email === event.current.email
      ) {
        await persistence.updateObject<Notification>(
          ctx,
          verifyEmailNotification.id,
          { data: { ...verifyEmailNotification.data, completed: true } }
        );
      }
    }

    if (event.current?.phone_verified && !event.previous?.phone_verified) {
      const [verifyPhoneNotification] = await search.search<Notification>(
        ctx,
        "notification",
        {
          filters: {
            and: [
              {
                user: event.current.id,
              },
              { type: "verify_phone" as NotificationTypeVS },
            ],
          },
          sort_by: { created_at: "desc" },
        }
      );

      if (
        verifyPhoneNotification &&
        verifyPhoneNotification.data &&
        verifyPhoneNotification.data.completed === false &&
        verifyPhoneNotification.data.phone === event.current.phone
      ) {
        await persistence.updateObject<Notification>(
          ctx,
          verifyPhoneNotification.id,
          { data: { ...verifyPhoneNotification.data, completed: true } }
        );
      }
    }
  }
);
