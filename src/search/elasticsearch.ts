import { errors, wrapper } from "@/components";
import { Context } from "@/tracing";
import { Client } from "@elastic/elasticsearch";
import { SearchCriteria, SearchDriver } from ".";

export interface ElasticSearchSearchConfig {
  node: string;
  prefix: string;
}

const constructElasticSearchQueryString = (criteria: SearchCriteria) => {
  if (criteria.query) {
    return {
      must: {
        query_string: {
          query: `*${criteria.query}*`,
        },
      },
    };
  }

  return {};
};

const serializeFilter = (term: { [key: string]: string | number }) => {
  return { term };
};

const constructElasticSearchFilters = (criteria: SearchCriteria) => {
  if (!criteria.filters) {
    return {};
  }

  const and = criteria.filters.and || [];
  const or = criteria.filters.or || [];

  const andQuery = and.map(serializeFilter);

  const orQuery = or.map(serializeFilter);

  const hasFilters = andQuery.length || orQuery.length;

  if (!hasFilters) {
    return {};
  }

  const filter: any = { bool: {} };

  if (andQuery.length) {
    filter.bool.must = andQuery;
  }

  if (orQuery.length) {
    filter.bool.should = orQuery;
  }

  return { filter: [filter] };
};

const constructElasticSearchQuery = (criteria: SearchCriteria) => {
  return {
    bool: {
      ...constructElasticSearchQueryString(criteria),
      ...constructElasticSearchFilters(criteria),
    },
  };
};

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

      const query = constructElasticSearchQuery(criteria);

      const options = {
        index: this.prefixIndex(index),
        query,
      };

      ctx.log.debug("query options", { options });

      const result = await this.client.search(options);

      ctx.log.debug("search query result", { result });

      return result.hits.hits.map((hit) => hit._id);
    }
  );
}
