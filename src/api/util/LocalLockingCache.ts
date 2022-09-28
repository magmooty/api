import { wrapper } from "@/components";
import { wait } from "@/util/wait";
import { Context } from "@/tracing";

export interface LocalLockingCacheConfig {
  lockRecheckInterval: number;
}

export class LocalLockingCache {
  private locks: { [key: string]: undefined | "locked" | "unlockable" } = {};
  private space: { [key: string]: any } = {};

  constructor(private localLockingCacheConfig: LocalLockingCacheConfig) {}

  getLock = wrapper(
    { name: "getLock", file: __filename },
    async (ctx: Context, key: any): Promise<void> => {
      if (!this.locks[key]) {
        this.locks[key] = "locked";
        ctx.log.info("local cache key locked");
        return;
      }

      if (this.locks[key] === "locked") {
        const { lockRecheckInterval } = this.localLockingCacheConfig;

        ctx.log.info(
          `local cache key is locked, waiting ${lockRecheckInterval}ms`
        );

        await wait(lockRecheckInterval);

        return this.getLock(ctx, key);
      }

      if (this.locks[key] === "unlockable") {
        ctx.log.info(
          "local cache key is unlockable, allowing further processing"
        );
        return;
      }
    }
  );

  freeLock = wrapper(
    { name: "freeLock", file: __filename },
    async (ctx: Context, key: any, unlockable = true) => {
      if (!this.locks[key]) {
        ctx.log.info("lock on local key is already free");
        return;
      }

      if (this.locks[key] === "unlockable") {
        ctx.log.info("lock is unloackable and already freed");
        return;
      }

      if (this.locks[key] === "locked" && unlockable) {
        this.locks[key] = "unlockable";
        ctx.log.info("lock is set to unloackable");
        return;
      }

      if (this.locks[key] === "locked" && !unlockable) {
        delete this.locks[key];
        ctx.log.info("lock is freed");
        return;
      }
    }
  );

  get = wrapper(
    { name: "get", file: __filename },
    async <T>(
      ctx: Context,
      key: any,
      defaultValue?: () => Promise<any>
    ): Promise<T | undefined> => {
      if (!this.space[key] && !defaultValue) {
        return;
      }

      if (!this.space[key] && defaultValue) {
        const value = await defaultValue();

        await this.set(ctx, key, value);

        return value;
      }

      return this.space[key];
    }
  );

  lockAndGet = wrapper(
    { name: "lockAndGet", file: __filename },
    async <T>(
      ctx: Context,
      key: any,
      defaultValue?: () => Promise<any>,
      unlockable = true
    ): Promise<T | undefined> => {
      await this.getLock(ctx, key);

      const value = await this.get(ctx, key, defaultValue);

      await this.freeLock(ctx, key, unlockable);

      return value as any;
    }
  );

  set = wrapper(
    { name: "set", file: __filename },
    async <T>(ctx: Context, key: any, value: T): Promise<void> => {
      this.space[key] = value;
    }
  );

  del = wrapper(
    { name: "del", file: __filename },
    async (ctx: Context, key: any): Promise<void> => {
      delete this.space[key];
    }
  );
}
