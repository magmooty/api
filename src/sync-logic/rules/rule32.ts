import { persistence, wrapper } from "@/components";
import { SystemUser, User, UserRole } from "@/graph/objects/types";
import { BaseQueueEvent } from "@/queue";
import { Context } from "@/tracing";

export const rule32 = wrapper(
  { name: "rule32", file: __filename },
  async (ctx: Context, event: BaseQueueEvent<UserRole>) => {
    if (!event.current) {
      return;
    }

    const user = await persistence.getObject<User>(ctx, event.current.user);

    const systemUser = await persistence.getObject<SystemUser>(
      ctx,
      user.system_user
    );

    await persistence.updateObject(
      ctx,
      systemUser.id,
      {
        last_acceptable_session_id: systemUser.last_session_id + 1,
      },
      { author: event.author }
    );
  }
);
