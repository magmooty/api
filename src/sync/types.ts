import { MappingProperty } from "@elastic/elasticsearch/lib/api/types";
import { IndexName } from "./mapping";

export interface IndexMapping {
  mapping: Record<string, MappingProperty>;
}

export type SyncOperationMethod = "create" | "update" | "delete";

export interface SyncOperation<T = { [key: string]: string | number }> {
  method: SyncOperationMethod;
  id: string;
  index: IndexName;
  data: Partial<T>;
}
