import { persistence } from "@/components";
import { GraphObject, ObjectType } from "@/graph/objects/types";
import { SeedObjectsResult } from "@/persistence";
import { Context } from "@/tracing";

export const seedQueryObjects = async (
  ctx: Context,
  objectType: ObjectType,
  pointer: string | null,
  callback: (results: GraphObject[]) => Promise<void>
) => {
  let allFetched = false;
  let after = pointer;

  while (!allFetched) {
    const { results, nextKey }: SeedObjectsResult<GraphObject> =
      await persistence.primaryDB.queryObjects<GraphObject>(
        null,
        objectType,
        null,
        after
      );

    try {
      await callback(results);
    } catch (error) {
      ctx.log.error(error, "An error occurred");

      if (after) {
        ctx.fatal(
          `An error occurred, please check it and you can continue seeding by using --after=${after}`
        );
      } else {
        ctx.fatal(
          "Failed to reseed the object, please check the config and make sure it's correct"
        );
      }
    }

    if (nextKey) {
      after = nextKey;
    } else {
      allFetched = true;
    }
  }
};
