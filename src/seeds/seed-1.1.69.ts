// Start using system user for keeping hash passwords
import { persistence, wrapper } from "@/components";
import { GraphObject, ObjectType, SystemUser } from "@/graph/objects/types";
import { generateID } from "@/persistence/commons/generate-id";
import { seedQueryObjects } from "@/persistence/commons/query-objects";
import { Context } from "@/tracing";
import yargs from "yargs/yargs";

const main = wrapper(
  { name: "init", file: __filename },
  async (ctx: Context) => {
    await persistence.init(ctx);

    const argv: any = yargs(process.argv).argv;

    if (!argv.object) {
      return console.error("You need to define an object");
    }

    const objectType = argv.object as ObjectType;

    await seedQueryObjects(
      ctx,
      objectType,
      null,
      async (results: GraphObject[]) => {
        await Promise.all(
          results.map(async (result) => {
            if (!result.updated_at) {
              const updatedObject = await persistence.primaryDB.updateObject(
                ctx,
                result.id,
                {
                  updated_at: result.created_at,
                }
              );

              await persistence.cache.set(ctx, result.id, updatedObject);
            }
          })
        );
      }
    );

    persistence.quit();
  }
);

main();
