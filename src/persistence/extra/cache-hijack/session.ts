import { wrapper, config, persistence } from "@/components";
import { GraphObject } from "@/graph/objects/types";
import { Context } from "@/tracing";

export const onPost = wrapper(
  { name: "onPost", file: __filename },
  async (ctx: Context, object: GraphObject) => {
    switch (config.auth.driver) {
      case "native":
        await persistence.cache.set(
          ctx,
          object.id,
          object,
          config.auth.config.sessionTTL
        );
        break;
    }
  }
);
