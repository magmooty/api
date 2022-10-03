import { persistence, queue, wrapper } from "@/components";
import { GraphObject, ObjectType } from "@/graph/objects/types";
import { SeedObjectsResult } from "@/persistence";
import { seedQueryObjects } from "@/persistence/commons/query-objects";
import { QueueEvent } from "@/queue";
import { Context } from "@/tracing";
import { Client } from "@elastic/elasticsearch";
import {
  IndicesIndexSettings,
  MappingProperty,
  MappingRuntimeField,
} from "@elastic/elasticsearch/lib/api/types";
import { SyncDriver } from ".";
import { mappings } from "./mapping";
import syncers from "./syncers";
import { SyncOperation } from "./types";

export interface ElasticSearchSyncConfig {
  numberOfShards: number;
  numberOfReplicas: number;
  node: string;
  prefix: string;
}

const INDEX_SETTINGS = {
  analysis: {
    filter: {
      arabic_stop: {
        type: "stop",
        stopwords: "_arabic_",
      },
      arabic_stemmer: {
        type: "stemmer",
        language: "arabic",
      },
      english_stop: {
        type: "stop",
        stopwords: "_english_",
      },
      english_stemmer: {
        type: "stemmer",
        language: "english",
      },
      english_possessive_stemmer: {
        type: "stemmer",
        language: "possessive_english",
      },
    },
    analyzer: {
      rebuilt_arabic: {
        type: "custom",
        tokenizer: "standard",
        filter: [
          "lowercase",
          "decimal_digit",
          "arabic_stop",
          "arabic_normalization",
          "arabic_stemmer",
        ],
      },
      rebuilt_english: {
        type: "custom",
        tokenizer: "standard",
        filter: [
          "english_possessive_stemmer",
          "lowercase",
          "english_stop",
          "english_stemmer",
        ],
      },
    },
  },
} as IndicesIndexSettings;

export class ElasticSearchSyncDriver implements SyncDriver {
  client: Client;

  constructor(private elasticSearchConfig: ElasticSearchSyncConfig) {
    const { node } = elasticSearchConfig;

    this.client = new Client({
      node,
    });
  }

  private prefixIndex = (indexName: string) => {
    return `${this.elasticSearchConfig.prefix}${indexName}`;
  };

  init = wrapper(
    { name: "init", file: __filename },
    async (ctx: Context, seedMode = false) => {
      if (!seedMode) {
        queue.subscribe(ctx, "sync", this.processEvent);
      }

      for (const indexName of Object.keys(mappings)) {
        const indexConfig = mappings[indexName as keyof typeof mappings];

        const prefixedIndexName = this.prefixIndex(indexName);

        ctx.log.info("Check if index exists", { prefixedIndexName });

        const exists = await this.client.indices.exists({
          index: prefixedIndexName,
        });

        if (exists) {
          ctx.log.info("Index found, skipping", { prefixedIndexName });
        } else {
          ctx.log.info("Index not found, creating index", {
            prefixedIndexName,
            indexConfig,
            indexSettings: INDEX_SETTINGS,
          });

          Object.keys(indexConfig.mapping).forEach((fieldName) => {
            if (indexConfig.mapping[fieldName].type === "date") {
              (indexConfig.mapping[fieldName] as MappingRuntimeField).format =
                "strict_date_time";
            }
          });

          await this.client.indices.create({
            index: prefixedIndexName,
            body: {
              mappings: {
                dynamic: false,
                properties: indexConfig.mapping,
              },
              settings: INDEX_SETTINGS,
            },
          });

          ctx.log.info("Index created", { prefixedIndexName });
        }
      }
    }
  );

  private applyOperation = wrapper(
    { name: "applyOperation", file: __filename },
    async (
      ctx: Context,
      { method, index, id, data }: SyncOperation
    ): Promise<void> => {
      const prefixedIndex = this.prefixIndex(index);

      switch (method) {
        case "create":
          await this.client.index({
            index: prefixedIndex,
            id,
            document: { ...data },
          });
          break;
        case "update":
          await this.client.update({
            index: prefixedIndex,
            id,
            doc: data,
          });
          break;
        case "delete":
          await this.client.delete({
            index: prefixedIndex,
            id,
          });
          break;
      }
    }
  );

  reseedObject = wrapper(
    { name: "reseed", file: __filename },
    async (
      ctx: Context,
      objectType: ObjectType,
      pointer: string | null = null,
      completeRecreation = true
    ) => {
      ctx.register({ objectType });

      const prefixedIndex = this.prefixIndex(objectType);

      if (!pointer && completeRecreation) {
        ctx.log.info("Deleting index", { prefixedIndex });

        await this.client.indices.delete({
          index: prefixedIndex,
        });

        ctx.log.info("Index deleted", { prefixedIndex });
      }

      await this.init(ctx, true);

      await seedQueryObjects(
        ctx,
        objectType,
        pointer,
        async (results: GraphObject[]) => {
          await Promise.all(
            results
              .filter((object) => !object.deleted_at)
              .map(async (object) => {
                const event: QueueEvent<GraphObject> = {
                  method: "POST",
                  type: "object",
                  path: objectType,
                  current: object,
                  spanId: ctx.spanId,
                  parentId: ctx.parentId,
                  traceId: ctx.traceId,
                  locale: "en",
                };

                await this.processEvent(ctx, event);
              })
          );
        }
      );
    }
  );

  processEvent = wrapper(
    { name: "processEvent", file: __filename },
    async (ctx: Context, event: QueueEvent): Promise<void> => {
      ctx.register(event);

      const handler: keyof typeof syncers =
        `${event.method} ${event.path}` as any;

      if (syncers[handler]) {
        const operations: SyncOperation[] = await syncers[handler](
          ctx,
          event as any
        );

        for (const operation of operations) {
          await this.applyOperation(ctx, operation);
        }
      }
    }
  );

  clearDBForTest = wrapper(
    { name: "clearDBForTest", file: __filename },
    async (ctx: Context) => {
      for (const indexName of Object.keys(mappings)) {
        const prefixedIndexName = `test_${indexName}`;

        const exists = await this.client.indices.exists({
          index: prefixedIndexName,
        });

        if (exists) {
          await this.client.indices.delete({ index: prefixedIndexName });
        }
      }

      await this.init(ctx);
    }
  );

  quit = async () => {
    await this.client.close();
  };
}
