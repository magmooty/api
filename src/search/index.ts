import { GraphObject } from "@/graph/objects/types";
import { IndexName } from "@/sync/mapping";
import { Context } from "@/tracing";
import { SortResults } from "@elastic/elasticsearch/lib/api/types";
import {
  ElasticSearchSearchConfig,
  ElasticSearchSearchDriver,
} from "./elasticsearch";

export interface RangeFilter {
  property: string;
  gt?: string | number;
  gte?: string | number;
  lt?: string | number;
  lte?: string | number;
}

export interface SearchCriteria {
  query?: string;
  filters?: {
    or?: {
      [key: string]: string | number | boolean;
    }[];
    and?: {
      [key: string]: string | number | boolean;
    }[];
  };
  ranges?: {
    or?: RangeFilter[];
    and?: RangeFilter[];
  };
  sort_by?: {
    [key: string]: "asc" | "desc";
  };
  limit?: number;
  after?: number;
}

export interface SearchPageResult<T> {
  count: number;
  results: T[];
  search_after?: SortResults;
}

export interface SearchInternalOptions {
  search_after?: SortResults;
}

export interface SearchDriver {
  init(ctx: Context | null): Promise<void>;

  search<T = GraphObject>(
    ctx: Context | null,
    index: IndexName,
    criteria: SearchCriteria,
    internalOptions?: SearchInternalOptions
  ): Promise<SearchPageResult<T>>;

  leanSearch(
    ctx: Context | null,
    index: IndexName,
    criteria: SearchCriteria,
    internalOptions?: SearchInternalOptions
  ): Promise<SearchPageResult<string>>;
}

export interface SearchConfig {
  driver: "elasticsearch";
  config: ElasticSearchSearchConfig;
}

export const createSearchDriver = ({ driver, config }: SearchConfig) => {
  switch (driver) {
    case "elasticsearch":
      return new ElasticSearchSearchDriver(config);
  }
};
