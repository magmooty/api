import { queue, wrapper } from "@/components";
import { QueueEvent } from "@/queue";
import { Context } from "@/tracing";
import { Client } from "@elastic/elasticsearch";
import { IndicesIndexSettings } from "@elastic/elasticsearch/lib/api/types";
import { SyncDriver } from ".";
import { mappings } from "./mapping";
import syncers from "./syncers";
import { SyncOperation } from "./types";

export interface ElasticSearchConfig {
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

  constructor(private elasticSearchConfig: ElasticSearchConfig) {
    const { node } = elasticSearchConfig;

    this.client = new Client({
      node,
    });
  }

  private prefixIndex = (indexName: string) => {
    return `${this.elasticSearchConfig.prefix}${indexName}`;
  };

  init = wrapper({ name: "init", file: __filename }, async (ctx: Context) => {
    queue.subscribe(null, "sync", this.processEvent);

    for (const indexName of Object.keys(mappings)) {
      const indexConfig = mappings[indexName as keyof typeof mappings];

      const prefixedIndexName = this.prefixIndex(indexName);

      ctx.log.debug("Check if index exists", { prefixedIndexName });

      const exists = await this.client.indices.exists({
        index: prefixedIndexName,
      });

      if (exists) {
        ctx.log.debug("Index found, skipping", { prefixedIndexName });
      } else {
        ctx.log.debug("Index not found, creating index", {
          prefixedIndexName,
          indexConfig,
          indexSettings: INDEX_SETTINGS,
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

        ctx.log.debug("Index created", { prefixedIndexName });
      }
    }
  });

  private applyOperation = wrapper(
    { name: "applyOperation", file: __filename },
    async (
      ctx: Context,
      { method, index, id, data }: SyncOperation
    ): Promise<void> => {
      const prefixedIndex = this.prefixIndex(index);

      console.log({ prefixedIndex, method, data, index, id });

      switch (method) {
        case "create":
          await this.client.create({
            index: prefixedIndex,
            id,
            document: { ...data, id },
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
}
