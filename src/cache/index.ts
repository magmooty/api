import { GraphObject, ObjectFieldValue } from "@/graph/objects/types";
import { Context } from "@/tracing";
import { RedisCacheDriverConfig } from "./redis";

export interface ScanOptions {
  match: string;
  count: string;
}

export interface ScanResult {
  cursor: string | number;
  results: string[];
}

export type CacheValue = string | number | Buffer;
export type ApplicationCachedValue =
  | CacheValue
  | GraphObject
  | Partial<GraphObject>
  | Object
  | ObjectFieldValue;

export interface CacheConfig {
  driver: "redis";
  config: RedisCacheDriverConfig;
}

export interface CacheDriver {
  init(): Promise<void>;
  append(ctx: Context | null, key: string, value: CacheValue): Promise<number>;
  set(
    ctx: Context | null,
    key: string,
    value: ApplicationCachedValue,
    ttl?: number | null,
    isNX?: boolean
  ): Promise<boolean>;
  mset(
    ctx: Context | null,
    keys: string[],
    objects: CacheValue[]
  ): Promise<void>;
  get(
    ctx: Context | null,
    key: string,
    raw?: boolean
  ): Promise<ApplicationCachedValue | null>;
  del(ctx: Context | null, keys: string): Promise<number>;
  mget(
    ctx: Context | null,
    keys: string[],
    raw?: boolean
  ): Promise<(string | number)[]>;
  keys(ctx: Context | null, pattern: string): Promise<string[]>;
  incr(ctx: Context | null, key: string): Promise<number>;
  decr(ctx: Context | null, key: string): Promise<number>;
  incrBy(ctx: Context | null, key: string, increment: number): Promise<number>;
  decrBy(ctx: Context | null, key: string, decrement: number): Promise<number>;
  setnx(ctx: Context | null, key: string, value: CacheValue): Promise<number>;
  expire(ctx: Context | null, key: string, seconds: number): Promise<number>;
  scan(
    ctx: Context | null,
    cursor: number | string,
    options: ScanOptions
  ): Promise<ScanResult>;
  exists(ctx: Context | null, key: string): Promise<boolean>;
  lpush(
    ctx: Context | null,
    key: string,
    values: CacheValue[]
  ): Promise<number>;
  lpushx(ctx: Context | null, key: string, value: CacheValue): Promise<number>;
  lpos(ctx: Context | null, key: string, value: CacheValue): Promise<number>;
  llen(ctx: Context | null, key: string): Promise<number>;
  lrange(
    ctx: Context | null,
    key: string,
    start: number,
    stop?: number
  ): Promise<string[]>;
  lrem(ctx: Context | null, key: string, value: CacheValue): Promise<number>;
  ttl(ctx: Context | null, key: string): Promise<number>;
  rPush(ctx: Context | null, key: string, data: CacheValue): Promise<number>;
  quit(): Promise<void>;
}
