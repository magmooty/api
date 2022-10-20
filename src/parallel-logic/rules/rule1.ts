import { persistence, wrapper } from "@/components";
import { NotificationIcons } from "@/graph/extra/notification/notification-icons";
import { Notification, User } from "@/graph/objects/types";
import { QueueEvent } from "@/queue";
import { Context } from "@/tracing";

export const rule1 = wrapper(
  { name: "rule1", file: __filename },
  async (ctx: Context, event: QueueEvent<User>) => {
    const createPhoneNotification = async () => {
      if (event.current) {
        await persistence.createObject<Notification>(ctx, {
          alert: true,
          level: "info",
          icon: NotificationIcons.VerifyPhone,
          data: { completed: false, phone: event.current.phone },
          type: "verify_phone",
          user: event.current.id,
          object_type: "notification",
        });
      }
    };

    const createEmailNotification = async () => {
      if (event.current) {
        await persistence.createObject<Notification>(ctx, {
          alert: true,
          level: "info",
          icon: NotificationIcons.VerifyEmail,
          data: { completed: false, email: event.current.email },
          type: "verify_email",
          user: event.current.id,
          object_type: "notification",
        });
      }
    };

    switch (event.method) {
      case "POST":
        if (event.current?.phone) {
          await createPhoneNotification();
        }

        if (event.current?.email) {
          await createEmailNotification();
        }
        break;
      case "PATCH":
        if (
          event.current?.phone &&
          event.current.phone !== event.previous?.phone
        ) {
          await createPhoneNotification();
        }

        if (
          event.current?.email &&
          event.current.email !== event.previous?.email
        ) {
          await createEmailNotification();
        }

        break;
    }
  }
);
