import { persistence, wrapper } from "@/components";
import { GraphObject } from "@/graph/objects/types";
import { IndexName } from "@/sync/mapping";
import { Context } from "@/tracing";
import { Client } from "@elastic/elasticsearch";
import { RangeFilter, SearchCriteria, SearchDriver, SearchPageResult } from ".";

export interface ElasticSearchSearchConfig {
  node: string;
  prefix: string;
  defaultLimit: number;
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

const serializeFilter = (term: { [key: string]: string | number | boolean }) => {
  return { term };
};

const serializeRange = ({ property, ...rangeQueryOptions }: RangeFilter) => {
  return {
    range: {
      [property]: rangeQueryOptions,
    },
  };
};

const constructElasticSearchFilters = (criteria: SearchCriteria) => {
  const andFilter = criteria.filters?.and || [];
  const orFilter = criteria.filters?.or || [];

  const andRange = criteria.ranges?.and || [];
  const orRange = criteria.ranges?.or || [];

  const andQuery = [
    ...andFilter.map(serializeFilter),
    ...andRange.map(serializeRange),
  ];

  const orQuery = [
    ...orFilter.map(serializeFilter),
    ...orRange.map(serializeRange),
  ];

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
  if (!criteria.query && !criteria.filters && !criteria.ranges) {
    return { match_all: {} };
  }

  return {
    bool: {
      ...constructElasticSearchQueryString(criteria),
      ...constructElasticSearchFilters(criteria),
    },
  };
};

const constructElasticSearchSorter = (criteria: SearchCriteria) => {
  const mutableCriteria = { ...criteria };

  let sorters: any[] = [{ _id: "desc" }];

  if (mutableCriteria.sort_by) {
    if (mutableCriteria.sort_by.created_at) {
      mutableCriteria.sort_by._id = mutableCriteria.sort_by.created_at;
      delete mutableCriteria.sort_by.created_at;
    }

    const keys = Object.keys(mutableCriteria.sort_by);

    if (keys.length > 0) {
      sorters = keys.map((key) => ({
        [key]: (mutableCriteria.sort_by as any)[key],
      }));
    }
  }

  return sorters;
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

  init = wrapper({ name: "init", file: __filename }, async () => {
    await this.client.cluster.putSettings({
      persistent: {
        "indices.id_field_data.enabled": true,
      },
    });
  });

  private _search = wrapper(
    { name: "search", file: __filename },
    async (
      ctx: Context,
      index: IndexName,
      criteria: SearchCriteria,
      internalOptions: { lean: boolean }
    ): Promise<SearchPageResult<string | GraphObject>> => {
      const query = constructElasticSearchQuery(criteria);
      const sort = constructElasticSearchSorter(criteria);

      const options = {
        index: this.prefixIndex(index),
        query,
        sort,
        size: criteria.limit || this.elasticSearchConfig.defaultLimit,
        from: criteria.after || 0,
      };

      ctx.log.debug("query options", { options });

      const result = await this.client.search(options);

      ctx.log.info("search query result", { result });

      const ids = result.hits.hits.map((hit) => hit._id);
      const count = (result.hits.total as any).value || 0;

      if (internalOptions.lean) {
        return { count, results: ids };
      }

      const results = await Promise.all(
        ids.map((id) => persistence.getObject<GraphObject>(ctx, id))
      );

      return { results, count };
    }
  );

  leanSearch(
    ctx: Context,
    index: IndexName,
    criteria: SearchCriteria
  ): Promise<SearchPageResult<string>> {
    return this._search(ctx, index, criteria, {
      lean: true,
    });
  }

  search<T = GraphObject>(
    ctx: Context,
    index: IndexName,
    criteria: SearchCriteria
  ): Promise<SearchPageResult<T>> {
    return this._search(ctx, index, criteria, {
      lean: false,
    });
  }
}
