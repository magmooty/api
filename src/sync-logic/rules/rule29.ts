import { persistence, wrapper } from "@/components";
import { User, Space, TutorRole } from "@/graph/objects/types";
import { BaseQueueEvent } from "@/queue";
import { Context } from "@/tracing";

export const rule29 = wrapper(
  { name: "rule29", file: __filename },
  async (ctx: Context, event: BaseQueueEvent<Space>) => {
    if (!event.current || !event.author) {
      return;
    }

    const { phone, email } = await persistence.getObject<User>(
      ctx,
      event.author
    );

    const contacts = [];

    if (phone) {
      contacts.push({ type: "phone", value: phone });
    }

    if (email) {
      contacts.push({ type: "email", value: email });
    }

    await persistence.createObject<TutorRole>(
      ctx,
      {
        object_type: "tutor_role",
        user: event.author,
        space: event.current.id,
        contacts,
      },
      { author: event.author }
    );
  }
);
