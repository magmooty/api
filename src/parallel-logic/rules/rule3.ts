import { persistence, wrapper } from "@/components";
import { NotificationIcons } from "@/graph/extra/notification-icons";
import { TutorRole } from "@/graph/objects/types";
import { QueueEvent } from "@/queue";
import { Context } from "@/tracing";

export const rule3 = wrapper(
  { name: "rule3", file: __filename },
  async (ctx: Context, event: QueueEvent<TutorRole>) => {
    if (event.current) {
      await persistence.createObject(ctx, {
        alert: true,
        level: "info",
        icon: NotificationIcons.CompleteTutorProfile,
        object_type: "notification",
        type: "complete_tutor_profile",
        user: event.current.user,
        data: { progress: 0 },
      });

      await persistence.createObject(ctx, {
        alert: true,
        level: "info",
        icon: NotificationIcons.TutorGetStarted,
        object_type: "notification",
        type: "tutor_get_started",
        user: event.current.user,
      });
    }
  }
);
