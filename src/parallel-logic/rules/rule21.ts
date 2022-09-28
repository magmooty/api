import { config, persistence, search, wrapper } from "@/components";
import { getObjectConfigFromObjectType } from "@/graph";
import { GraphObject } from "@/graph/objects/types";
import { QueueEvent } from "@/queue";
import { Context } from "@/tracing";
import nodeQueue from "queue";

const tryDeleteObject = wrapper(
  { name: "tryDeleteObject", file: __filename },
  async (ctx: Context, id: string, author?: string) => {
    try {
      await persistence.deleteObject<GraphObject>(ctx, id, { author });
      ctx.log.info("Successfully deep deleted object", { id, author });
    } catch (error) {
      ctx.log.error(error, "Failed to deep delete an object", { id, author });
    }
  }
);

const tryDeleteEdge = wrapper(
  { name: "tryDeleteEdge", file: __filename },
  async (
    ctx: Context,
    src: string,
    edgeName: string,
    dst: string,
    author?: string
  ) => {
    try {
      await persistence.deleteEdge(ctx, src, edgeName, dst, { author });
      ctx.log.info("Successfully deep deleted edge", {
        src,
        edgeName,
        dst,
        author,
      });
    } catch (error) {
      ctx.log.error(error, "Failed to deep delete an edge", {
        src,
        edgeName,
        dst,
        author,
      });
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

            await tryDeleteObject(
              ctx,
              event.current[deepDeletedField] as string,
              event.author
            );
          }
        });
      });

      objectConfig.deepDeletedEdgesOnFields?.forEach(
        (deepDeletedEdgeOnField) => {
          q.push(async () => {
            if (event.current && event.current[deepDeletedEdgeOnField]) {
              ctx.log.info("Found deep deleted field for object", {
                deepDeletedField: deepDeletedEdgeOnField,
                id: event.current[deepDeletedEdgeOnField],
              });

              for (const edgeName of objectConfig.fields[deepDeletedEdgeOnField]
                ?.deepDeleteFromEdges || []) {
                await tryDeleteEdge(
                  ctx,
                  event.current[deepDeletedEdgeOnField] as string,
                  edgeName,
                  event.current.id,
                  event.author
                );
              }
            }
          });
        }
      );

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
              if (!event.current) {
                return;
              }

              const { deepDelete } = objectConfig.edges[deepDeletedEdge];

              if (deepDelete === "both" || deepDelete === "object") {
                await tryDeleteObject(ctx, id, event.author);
              }

              if (deepDelete === "both" || deepDelete === "edge") {
                await tryDeleteEdge(
                  ctx,
                  event.current.id,
                  deepDeletedEdge,
                  id,
                  event.author
                );
              }
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

          await search.allByBatch<string>(
            ctx,
            deepDeletionEntry.index,
            {
              filters: {
                and: [{ [deepDeletionEntry.property]: event.current?.id }],
              },
              limit: 100,
            },
            (id) => {
              q.push(async () => {
                await tryDeleteObject(ctx, id, event.author);
              });
            },
            { lean: true }
          );
        });
      });

      q.on("end", () => {
        resolve(true);
      });
    });
  }
);
