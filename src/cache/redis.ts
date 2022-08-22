import { wrapper } from "@/components";
import { Context } from "@/tracing";
import IORedis, { RedisCommander } from "ioredis";
import {
  ApplicationCachedValue,
  CacheDriver,
  CacheValue,
  ScanOptions,
  ScanResult,
} from ".";

export interface RedisCacheDriverConfig {
  driverName: string;
  host: string;
  port: number;
  prefix: string;
  cacheType: "single" | "cluster";
  databaseNumber: number;
  slotsRefreshTimeout: number;
}

export class RedisCacheDriver implements CacheDriver {
  cluster: RedisCommander = {} as any;

  constructor(private redisCacheDriverConfig: RedisCacheDriverConfig) {}

  init = wrapper({ name: "init", file: __filename }, () => {
    const {
      host,
      port,
      prefix: keyPrefix,
      cacheType,
      databaseNumber,
      slotsRefreshTimeout = 10000,
    } = this.redisCacheDriverConfig;

    if (cacheType === "single") {
      // Initialize the single instance
      this.cluster = new IORedis({
        host,
        port,
        ...(keyPrefix && { keyPrefix }),
        ...(databaseNumber && { db: databaseNumber }),
      });
    } else if (cacheType === "cluster") {
      // Initialize the cluster
      this.cluster = new IORedis.Cluster([{ host, port }], {
        enableReadyCheck: true,
        ...(keyPrefix && { keyPrefix }),
        dnsLookup: (address, callback) => callback(null, address),
        redisOptions: { tls: {} },
        slotsRefreshTimeout,
      });
    }
  });

  private prefixKey(key: string) {
    return this.redisCacheDriverConfig.prefix
      ? `${this.redisCacheDriverConfig.prefix}${key}`
      : key;
  }

  append = wrapper(
    { name: "append", file: __filename },
    (ctx: Context, key: string, value: CacheValue): Promise<number> => {
      ctx.startTrackTime("redis_requests_duration", "redis_errors_duration");

      ctx.register({ key, value });

      ctx.setDurationMetricLabels({ method: ctx.traceInfo.name });
      ctx.setErrorDurationMetricLabels({ method: ctx.traceInfo.name });

      return this.cluster.append(key, value);
    },
    (ctx: Context, error: Error) => {
      ctx.metrics.getCounter("redis_errors").inc({ error: error.message });
    },
    (ctx: Context) => {
      ctx.metrics
        .getCounter("redis_requests")
        .inc({ method: ctx.traceInfo.name });
    }
  );

  set = wrapper(
    { name: "set", file: __filename },
    async (
      ctx: Context,
      key: string,
      value: ApplicationCachedValue,
      ttl: number | null = null,
      isNX = false
    ): Promise<boolean> => {
      ctx.startTrackTime("redis_requests_duration", "redis_errors_duration");

      ctx.register({ key, value, ttl, isNX });

      ctx.setDurationMetricLabels({ method: ctx.traceInfo.name });
      ctx.setErrorDurationMetricLabels({ method: ctx.traceInfo.name });

      const serialized =
        typeof value === "string" ? value : JSON.stringify(value);

      let result;

      if (isNX && ttl) {
        result = await this.cluster.set(key, serialized, "EX", ttl, "NX");
      } else if (ttl) {
        result = await this.cluster.set(key, serialized, "EX", ttl);
      } else if (isNX) {
        result = await this.cluster.set(key, serialized, "NX");
      } else {
        result = await this.cluster.set(key, serialized);
      }

      return result ? true : false;
    },
    (ctx: Context, error: Error) => {
      ctx.metrics
        .getCounter("redis_errors")
        .inc({ method: ctx.traceInfo.name, error: error.message });
    },
    (ctx: Context) => {
      ctx.metrics
        .getCounter("redis_requests")
        .inc({ method: ctx.traceInfo.name });
    }
  );

  mset = wrapper(
    { name: "mset", file: __filename },
    async (
      ctx: Context,
      keys: string[],
      objects: CacheValue[]
    ): Promise<void> => {
      ctx.startTrackTime("redis_requests_duration", "redis_errors_duration");

      ctx.register({ keys, objects });

      ctx.setDurationMetricLabels({ method: ctx.traceInfo.name });
      ctx.setErrorDurationMetricLabels({ method: ctx.traceInfo.name });

      await this.cluster.mset(new Map([keys, objects] as any));
    },
    (ctx: Context, error: Error) => {
      ctx.metrics
        .getCounter("redis_errors")
        .inc({ method: ctx.traceInfo.name, error: error.message });
    },
    (ctx: Context) => {
      ctx.metrics
        .getCounter("redis_requests")
        .inc({ method: ctx.traceInfo.name });
    }
  );

  get = wrapper(
    { name: "get", file: __filename },
    async (
      ctx: Context,
      key: string,
      raw = false
    ): Promise<ApplicationCachedValue | null> => {
      ctx.startTrackTime(
        "redis_get_requests_duration",
        "redis_get_errors_duration"
      );

      try {
        const response = await this.cluster.get(key);

        if (response) {
          ctx.setParam("isHit", true);

          return raw ? response : JSON.parse(response as string);
        }
      } catch (error) {
        ctx.log.error(error, "get from redis failed", { key });
      }

      return null;
    },
    (ctx: Context, error: Error) => {
      ctx.metrics.getCounter("redis_get_errors").inc({ error: error.message });
    },
    (ctx: Context) => {
      const result = ctx.getParam("isHit") ? "hit" : "miss";

      ctx.metrics.getCounter("redis_get_requests").inc({ result });
    }
  );

  del = wrapper(
    { name: "del", file: __filename },
    (ctx: Context, key: string): Promise<number> => {
      ctx.startTrackTime("redis_requests_duration", "redis_errors_duration");

      ctx.register({ key });

      ctx.setDurationMetricLabels({ method: ctx.traceInfo.name });
      ctx.setErrorDurationMetricLabels({ method: ctx.traceInfo.name });

      return this.cluster.del(key);
    },
    (ctx: Context, error: Error) => {
      ctx.metrics
        .getCounter("redis_errors")
        .inc({ method: ctx.traceInfo.name, error: error.message });
    },
    (ctx: Context) => {
      ctx.metrics
        .getCounter("redis_requests")
        .inc({ method: ctx.traceInfo.name });
    }
  );

  mget = wrapper(
    { name: "mget", file: __filename },
    async (
      ctx: Context,
      keys: string[],
      raw = false
    ): Promise<(string | number)[]> => {
      ctx.startTrackTime("redis_requests_duration", "redis_errors_duration");

      ctx.register({ keys, raw });

      const response = await this.cluster.mget(keys);

      if (response) {
        const hitCount = response.reduce((p, c) => (c ? p++ : p), 0);
        const missCount = keys.length - hitCount;
        const hitRate = Math.round((hitCount / keys.length) * 100);

        ctx.setParam("hits", hitCount);
        ctx.setParam("misses", missCount);
        ctx.setParam("rate", hitRate);

        return raw
          ? response
          : response.map((object) => (object ? JSON.parse(object) : null));
      } else {
        return response;
      }
    },
    (ctx: Context, error: Error) => {
      ctx.metrics.getCounter("redis_mget_errors").inc({
        error: error.message,
      });
    },
    (ctx: Context) => {
      ctx.metrics
        .getCounter("redis_mget_requests")
        .inc({
          method: ctx.traceInfo.name,
          hits: ctx.getParam("hits"),
          misses: ctx.getParam("misses"),
          rate: ctx.getParam("rate"),
        });
    }
  );

  keys = wrapper(
    { name: "keys", file: __filename },
    (ctx: Context, pattern: string): Promise<string[]> => {
      ctx.startTrackTime("redis_requests_duration", "redis_errors_duration");

      ctx.register({ pattern });

      ctx.setDurationMetricLabels({ method: ctx.traceInfo.name });
      ctx.setErrorDurationMetricLabels({ method: ctx.traceInfo.name });

      return this.cluster.keys(this.prefixKey(pattern));
    },
    (ctx: Context, error: Error) => {
      ctx.metrics
        .getCounter("redis_errors")
        .inc({ method: ctx.traceInfo.name, error: error.message });
    },
    (ctx: Context) => {
      ctx.metrics
        .getCounter("redis_requests")
        .inc({ method: ctx.traceInfo.name });
    }
  );

  incr = wrapper(
    { name: "incr", file: __filename },
    (ctx: Context, key: string): Promise<number> => {
      ctx.startTrackTime("redis_requests_duration", "redis_errors_duration");

      ctx.register({ key });

      ctx.setDurationMetricLabels({ method: ctx.traceInfo.name });
      ctx.setErrorDurationMetricLabels({ method: ctx.traceInfo.name });

      return this.cluster.incr(key);
    },
    (ctx: Context, error: Error) => {
      ctx.metrics
        .getCounter("redis_errors")
        .inc({ method: ctx.traceInfo.name, error: error.message });
    },
    (ctx: Context) => {
      ctx.metrics
        .getCounter("redis_requests")
        .inc({ method: ctx.traceInfo.name });
    }
  );

  decr = wrapper(
    { name: "decr", file: __filename },
    (ctx: Context, key: string): Promise<number> => {
      ctx.startTrackTime("redis_requests_duration", "redis_errors_duration");

      ctx.register({ key });

      ctx.setDurationMetricLabels({ method: ctx.traceInfo.name });
      ctx.setErrorDurationMetricLabels({ method: ctx.traceInfo.name });

      return this.cluster.decr(key);
    },
    (ctx: Context, error: Error) => {
      ctx.metrics
        .getCounter("redis_errors")
        .inc({ method: ctx.traceInfo.name, error: error.message });
    },
    (ctx: Context) => {
      ctx.metrics
        .getCounter("redis_requests")
        .inc({ method: ctx.traceInfo.name });
    }
  );

  incrBy = wrapper(
    { name: "incrBy", file: __filename },
    (ctx: Context, key: string, increment: number): Promise<number> => {
      ctx.startTrackTime("redis_requests_duration", "redis_errors_duration");

      ctx.register({ key, increment });

      ctx.setDurationMetricLabels({ method: ctx.traceInfo.name });
      ctx.setErrorDurationMetricLabels({ method: ctx.traceInfo.name });

      return this.cluster.incrby(key, increment);
    },
    (ctx: Context, error: Error) => {
      ctx.metrics
        .getCounter("redis_errors")
        .inc({ method: ctx.traceInfo.name, error: error.message });
    },
    (ctx: Context) => {
      ctx.metrics
        .getCounter("redis_requests")
        .inc({ method: ctx.traceInfo.name });
    }
  );

  decrBy = wrapper(
    { name: "decrBy", file: __filename },
    (ctx: Context, key: string, decrement: number): Promise<number> => {
      ctx.startTrackTime("redis_requests_duration", "redis_errors_duration");

      ctx.register({ key, decrement });

      ctx.setDurationMetricLabels({ method: ctx.traceInfo.name });
      ctx.setErrorDurationMetricLabels({ method: ctx.traceInfo.name });

      return this.cluster.decrby(key, decrement);
    },
    (ctx: Context, error: Error) => {
      ctx.metrics
        .getCounter("redis_errors")
        .inc({ method: ctx.traceInfo.name, error: error.message });
    },
    (ctx: Context) => {
      ctx.metrics
        .getCounter("redis_requests")
        .inc({ method: ctx.traceInfo.name });
    }
  );

  setnx = wrapper(
    { name: "setnx", file: __filename },
    (ctx: Context, key: string, value: CacheValue): Promise<number> => {
      ctx.startTrackTime("redis_requests_duration", "redis_errors_duration");

      ctx.register({ key, value });

      ctx.setDurationMetricLabels({ method: ctx.traceInfo.name });
      ctx.setErrorDurationMetricLabels({ method: ctx.traceInfo.name });

      return this.cluster.setnx(key, value);
    },
    (ctx: Context, error: Error) => {
      ctx.metrics
        .getCounter("redis_errors")
        .inc({ method: ctx.traceInfo.name, error: error.message });
    },
    (ctx: Context) => {
      ctx.metrics
        .getCounter("redis_requests")
        .inc({ method: ctx.traceInfo.name });
    }
  );

  expire = wrapper(
    { name: "expire", file: __filename },
    (ctx: Context, key: string, seconds: number): Promise<number> => {
      ctx.startTrackTime("redis_requests_duration", "redis_errors_duration");

      ctx.register({ key, seconds });

      ctx.setDurationMetricLabels({ method: ctx.traceInfo.name });
      ctx.setErrorDurationMetricLabels({ method: ctx.traceInfo.name });

      return this.cluster.expire(key, seconds);
    },
    (ctx: Context, error: Error) => {
      ctx.metrics
        .getCounter("redis_errors")
        .inc({ method: ctx.traceInfo.name, error: error.message });
    },
    (ctx: Context) => {
      ctx.metrics
        .getCounter("redis_requests")
        .inc({ method: ctx.traceInfo.name });
    }
  );

  scan = wrapper(
    { name: "scan", file: __filename },
    async (
      ctx: Context,
      cursor: string | number,
      options: ScanOptions
    ): Promise<ScanResult> => {
      ctx.startTrackTime("redis_requests_duration", "redis_errors_duration");

      ctx.register({ cursor, options });

      ctx.setDurationMetricLabels({ method: ctx.traceInfo.name });
      ctx.setErrorDurationMetricLabels({ method: ctx.traceInfo.name });

      const args = [
        ...[options.match ? ["MATCH", this.prefixKey(options.match)] : []],
        ...[options.count ? ["COUNT", options.count] : []],
      ];

      const [nextCursor, response] = await this.cluster.scan(
        cursor,
        ...(args as any)
      );

      const results = this.redisCacheDriverConfig.prefix
        ? response.map((key) =>
            key.substring(this.redisCacheDriverConfig.prefix.length)
          )
        : response;

      ctx.metrics.getCounter("redis_scanned_keys").inc(results.length);

      return {
        cursor: nextCursor,
        results,
      };
    },
    (ctx: Context, error: Error) => {
      ctx.metrics
        .getCounter("redis_errors")
        .inc({ method: ctx.traceInfo.name, error: error.message });
    },
    (ctx: Context) => {
      ctx.metrics
        .getCounter("redis_requests")
        .inc({ method: ctx.traceInfo.name });
    }
  );

  exists = wrapper(
    { name: "exists", file: __filename },
    async (ctx: Context, key: string): Promise<boolean> => {
      ctx.startTrackTime("redis_requests_duration", "redis_errors_duration");

      ctx.register({ key });

      ctx.setDurationMetricLabels({ method: ctx.traceInfo.name });
      ctx.setErrorDurationMetricLabels({ method: ctx.traceInfo.name });

      return (await this.cluster.exists(key)) ? true : false;
    },
    (ctx: Context, error: Error) => {
      ctx.metrics
        .getCounter("redis_errors")
        .inc({ method: ctx.traceInfo.name, error: error.message });
    },
    (ctx: Context) => {
      ctx.metrics
        .getCounter("redis_requests")
        .inc({ method: ctx.traceInfo.name });
    }
  );

  lpush = wrapper(
    { name: "lpush", file: __filename },
    (ctx: Context, key: string, values: CacheValue[]): Promise<number> => {
      ctx.startTrackTime("redis_requests_duration", "redis_errors_duration");

      ctx.register({ key });

      ctx.setDurationMetricLabels({ method: ctx.traceInfo.name });
      ctx.setErrorDurationMetricLabels({ method: ctx.traceInfo.name });

      return this.cluster.lpush(key, ...values);
    },
    (ctx: Context, error: Error) => {
      ctx.metrics
        .getCounter("redis_errors")
        .inc({ method: ctx.traceInfo.name, error: error.message });
    },
    (ctx: Context) => {
      ctx.metrics
        .getCounter("redis_requests")
        .inc({ method: ctx.traceInfo.name });
    }
  );

  lpushx = wrapper(
    { name: "lpushx", file: __filename },
    (ctx: Context, key: string, value: CacheValue): Promise<number> => {
      ctx.startTrackTime("redis_requests_duration", "redis_errors_duration");

      ctx.register({ key });

      ctx.setDurationMetricLabels({ method: ctx.traceInfo.name });
      ctx.setErrorDurationMetricLabels({ method: ctx.traceInfo.name });

      return this.cluster.lpushx(key, value);
    },
    (ctx: Context, error: Error) => {
      ctx.metrics
        .getCounter("redis_errors")
        .inc({ method: ctx.traceInfo.name, error: error.message });
    },
    (ctx: Context) => {
      ctx.metrics
        .getCounter("redis_requests")
        .inc({ method: ctx.traceInfo.name });
    }
  );

  lpos = wrapper(
    { name: "lpos", file: __filename },
    async (ctx: Context, key: string, value: CacheValue): Promise<number> => {
      ctx.startTrackTime("redis_requests_duration", "redis_errors_duration");

      ctx.register({ key });

      ctx.setDurationMetricLabels({ method: ctx.traceInfo.name });
      ctx.setErrorDurationMetricLabels({ method: ctx.traceInfo.name });

      const position = await this.cluster.lpos(key, value);

      return position && position >= 0 ? position : -1;
    },
    (ctx: Context, error: Error) => {
      ctx.metrics
        .getCounter("redis_errors")
        .inc({ method: ctx.traceInfo.name, error: error.message });
    },
    (ctx: Context) => {
      ctx.metrics
        .getCounter("redis_requests")
        .inc({ method: ctx.traceInfo.name });
    }
  );

  llen = wrapper(
    { name: "llen", file: __filename },
    (ctx: Context, key: string): Promise<number> => {
      ctx.startTrackTime("redis_requests_duration", "redis_errors_duration");

      ctx.register({ key });

      ctx.setDurationMetricLabels({ method: ctx.traceInfo.name });
      ctx.setErrorDurationMetricLabels({ method: ctx.traceInfo.name });

      return this.cluster.llen(key);
    },
    (ctx: Context, error: Error) => {
      ctx.metrics
        .getCounter("redis_errors")
        .inc({ method: ctx.traceInfo.name, error: error.message });
    },
    (ctx: Context) => {
      ctx.metrics
        .getCounter("redis_requests")
        .inc({ method: ctx.traceInfo.name });
    }
  );

  lrange = wrapper(
    { name: "lrange", file: __filename },
    (
      ctx: Context,
      key: string,
      start: number,
      stop = -1
    ): Promise<string[]> => {
      ctx.startTrackTime("redis_requests_duration", "redis_errors_duration");

      ctx.register({ key });

      ctx.setDurationMetricLabels({ method: ctx.traceInfo.name });
      ctx.setErrorDurationMetricLabels({ method: ctx.traceInfo.name });

      return this.cluster.lrange(key, start, stop);
    },
    (ctx: Context, error: Error) => {
      ctx.metrics
        .getCounter("redis_errors")
        .inc({ method: ctx.traceInfo.name, error: error.message });
    },
    (ctx: Context) => {
      ctx.metrics
        .getCounter("redis_requests")
        .inc({ method: ctx.traceInfo.name });
    }
  );

  lrem = wrapper(
    { name: "lrem", file: __filename },
    (ctx: Context, key: string, value: CacheValue): Promise<number> => {
      ctx.startTrackTime("redis_requests_duration", "redis_errors_duration");

      ctx.register({ key });

      ctx.setDurationMetricLabels({ method: ctx.traceInfo.name });
      ctx.setErrorDurationMetricLabels({ method: ctx.traceInfo.name });

      return this.cluster.lrem(key, 999, value);
    },
    (ctx: Context, error: Error) => {
      ctx.metrics
        .getCounter("redis_errors")
        .inc({ method: ctx.traceInfo.name, error: error.message });
    },
    (ctx: Context) => {
      ctx.metrics
        .getCounter("redis_requests")
        .inc({ method: ctx.traceInfo.name });
    }
  );

  ttl = wrapper(
    { name: "ttl", file: __filename },
    (ctx: Context, key: string): Promise<number> => {
      ctx.startTrackTime("redis_requests_duration", "redis_errors_duration");

      ctx.register({ key });

      ctx.setDurationMetricLabels({ method: ctx.traceInfo.name });
      ctx.setErrorDurationMetricLabels({ method: ctx.traceInfo.name });

      return this.cluster.ttl(key);
    },
    (ctx: Context, error: Error) => {
      ctx.metrics
        .getCounter("redis_errors")
        .inc({ method: ctx.traceInfo.name, error: error.message });
    },
    (ctx: Context) => {
      ctx.metrics
        .getCounter("redis_requests")
        .inc({ method: ctx.traceInfo.name });
    }
  );

  rPush = wrapper(
    { name: "rPush", file: __filename },
    (ctx: Context, key: string, data: CacheValue): Promise<number> => {
      ctx.startTrackTime("redis_requests_duration", "redis_errors_duration");

      ctx.register({ key });

      ctx.setDurationMetricLabels({ method: ctx.traceInfo.name });
      ctx.setErrorDurationMetricLabels({ method: ctx.traceInfo.name });

      return this.cluster.rpush(key, data);
    },
    (ctx: Context, error: Error) => {
      ctx.metrics
        .getCounter("redis_errors")
        .inc({ method: ctx.traceInfo.name, error: error.message });
    },
    (ctx: Context) => {
      ctx.metrics
        .getCounter("redis_requests")
        .inc({ method: ctx.traceInfo.name });
    }
  );

  async quit(): Promise<void> {
    await this.cluster.quit();
  }
}
