import { wrapper } from "@/components";
import { QueueEvent } from "@/queue";
import { Context } from "@/tracing";

export const rule1 = wrapper(
  { name: "rule1", file: __filename },
  (ctx: Context, event: QueueEvent<User>) => {
    
  }
);
