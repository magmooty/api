import { IndexName } from "@/sync/mapping";
import { Context } from "@/tracing";

export interface SearchCriteria {
  query?: string;
  filters?: {
    [key: string]: string | number;
  };
}

export interface SearchDriver {
  search(
    ctx: Context | null,
    index: IndexName,
    criteria: SearchCriteria
  ): Promise<string[]>;
}
