import { GraphObject } from "@/graph/objects/types";
import { IndexName } from "@/sync/mapping";
import { Context } from "@/tracing";
import {
  ElasticSearchSearchConfig,
  ElasticSearchSearchDriver,
} from "./elasticsearch";

export interface SearchCriteria {
  query?: string;
  filters?: {
    or?: {
      [key: string]: string | number;
    }[];
    and?: {
      [key: string]: string | number;
    }[];
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
}

export interface SearchDriver {
  init(ctx: Context | null): Promise<void>;
  search<T = GraphObject>(
    ctx: Context | null,
    index: IndexName,
    criteria: SearchCriteria
  ): Promise<SearchPageResult<T>>;
  leanSearch(
    ctx: Context | null,
    index: IndexName,
    criteria: SearchCriteria
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
