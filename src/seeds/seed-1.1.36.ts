// Start using system user for keeping hash passwords
import { persistence, wrapper } from "@/components";
import { GraphObject, SystemUser } from "@/graph/objects/types";
import { generateID } from "@/persistence/commons/generate-id";
import { seedQueryObjects } from "@/persistence/commons/query-objects";
import { Context } from "@/tracing";

const main = wrapper(
  { name: "init", file: __filename },
  async (ctx: Context) => {
    await persistence.init();

    ctx.log.info("Removing hash from users and creating system users");

    await seedQueryObjects(
      ctx,
      "user",
      null,
      async (results: GraphObject[]) => {
        await Promise.all(
          results.map(async (result) => {
            const { hash } = result;

            const id = await generateID(ctx, "system-user");

            const systemUser =
              await persistence.primaryDB.createObject<SystemUser>(ctx, id, {
                hash,
                object_type: "system-user",
              });

            const updatedUser = await persistence.primaryDB.updateObject(
              ctx,
              result.id,
              {
                hash: null,
                system_user: systemUser.id,
              }
            );

            await persistence.cache.set(ctx, result.id, updatedUser);
          })
        );
      }
    );

    persistence.quit();
  }
);

main();
