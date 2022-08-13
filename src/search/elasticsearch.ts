import { errors, wrapper } from "@/components";
import { Context } from "@/tracing";
import { Client } from "@elastic/elasticsearch";
import { SearchCriteria, SearchDriver } from ".";

export interface ElasticSearchSearchConfig {
  node: string;
  prefix: string;
}

export class ElasticSearchSearchDriver implements SearchDriver {
  client: Client;

  constructor(private elasticSearchConfig: ElasticSearchSearchConfig) {
    const { node } = elasticSearchConfig;

    this.client = new Client({
      node,
    });
  }

  private prefixIndex = (indexName: string) => {
    return `${this.elasticSearchConfig.prefix}${indexName}`;
  };

  search = wrapper(
    { name: "search", file: __filename },
    async (
      ctx: Context,
      index: "user",
      criteria: SearchCriteria
    ): Promise<string[]> => {
      if (!criteria.query && !criteria.filters) {
        errors.createError(ctx, "InvalidSearchCriteria");
      }

      this.client.search({
        index: this.prefixIndex(index),
      });

      return [];
    }
  );
}
