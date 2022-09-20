import { MappingProperty } from "@elastic/elasticsearch/lib/api/types";
import { IndexName } from "./mapping";

export interface IndexMapping {
  mapping: Record<string, MappingProperty>;
}

export type SyncOperationMethod = "create" | "update" | "delete";

export type SearchEntryFieldValue =
  | string
  | string[]
  | number
  | number[]
  | undefined
  | boolean
  | null;

export interface SyncOperation<T = { [key: string]: SearchEntryFieldValue }> {
  method: SyncOperationMethod;
  id: string;
  index: IndexName;
  data: Partial<T>;
}
