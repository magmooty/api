import { config, persistence, search, wrapper } from "@/components";
import { getObjectConfigFromObjectType } from "@/graph";
import { GraphObject } from "@/graph/objects/types";
import { QueueEvent } from "@/queue";
import { SearchPageResult } from "@/search";
import { Context } from "@/tracing";
import nodeQueue from "queue";

const tryDelete = wrapper(
  { name: "tryDelete", file: __filename },
  async (ctx: Context, id: string, author?: string) => {
    try {
      await persistence.deleteObject<GraphObject>(ctx, id, { author });
      ctx.log.info("Successfully deep deleted object", { id, author });
    } catch (error) {
      ctx.log.error(error, "Failed to deep delete an object", { id, author });
    }
  }
);

export const rule21 = wrapper(
  { name: "rule21", file: __filename },
  async (ctx: Context, event: QueueEvent<GraphObject>) => {
    return new Promise(async (resolve) => {
      if (!event.current) {
        return;
      }

      const q = nodeQueue({
        autostart: true,
        concurrency: config.parallelLogic.deepDeletionSingleObjectConcurrency,
      });

      const objectConfig = await getObjectConfigFromObjectType(
        ctx,
        event.current.object_type
      );

      objectConfig.deepDeletedFields?.forEach((deepDeletedField) => {
        q.push(async () => {
          if (event.current && event.current[deepDeletedField]) {
            ctx.log.info("Found deep deleted field for object", {
              deepDeletedField,
              id: event.current[deepDeletedField],
            });

            await tryDelete(
              ctx,
              event.current[deepDeletedField] as string,
              event.author
            );
          }
        });
      });

      objectConfig.deepDeletedEdges?.forEach((deepDeletedEdge) => {
        q.push(async () => {
          if (!event.current) {
            return;
          }

          const dsts = await persistence.getEdges<string[]>(
            ctx,
            event.current.id,
            deepDeletedEdge,
            { lean: true }
          );

          ctx.log.info("Found deep deleted edges for object", {
            dsts,
            deepDeletedEdge,
          });

          dsts.forEach((id) => {
            q.push(async () => {
              await tryDelete(ctx, id, event.author);
            });
          });
        });
      });

      objectConfig.deepDeletion?.forEach((deepDeletionEntry) => {
        q.push(async () => {
          if (!event.current) {
            return;
          }

          ctx.log.info("Deep deleting using search queries", {
            deepDeletionEntry,
          });

          let searchAfter;
          let done = false;

          while (!done) {
            const result: SearchPageResult<string> = await search.leanSearch(
              ctx,
              deepDeletionEntry.index,
              {
                filters: {
                  and: [{ [deepDeletionEntry.property]: event.current?.id }],
                },
                limit: 100,
              },
              { search_after: searchAfter }
            );

            result.results.forEach((id) => {
              q.push(async () => {
                await tryDelete(ctx, id, event.author);
              });
            });

            searchAfter = result.search_after;
            done = result.results.length <= 0;
          }
        });
      });

      q.on("end", () => {
        resolve(true);
      });
    });
  }
);
