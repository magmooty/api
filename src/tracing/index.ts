import { Logger } from "@/logger";
import { nanoid } from "nanoid";

/**
 * Obtain the parameters of a function type in a tuple
 */
type ExtractParametersWithoutFirstParam<T extends (...args: any[]) => any> =
  T extends (arg0: infer P0, ...args: infer P) => any ? P : never;

/**
 * Obtain the return type of a function type
 */
type ExtractReturnType<T extends (...args: any[]) => any> = T extends (
  ...args: any[]
) => infer R
  ? R
  : any;

interface TraceInfo {
  name: string;
}

type RegisterFunction = (info: TraceInfo) => void;

export interface Context {
  log: Logger;
  register: RegisterFunction;
  traceId: string;
  spanId: string;
  parentId?: string;
}

export class Tracer {
  constructor(private log: Logger) {}

  wrapper<T extends (...args: any[]) => any>(
    func: T
  ): (
    rootCtx: Context | null,
    ...funcArgs: ExtractParametersWithoutFirstParam<T>
  ) => ExtractReturnType<T> {
    let traceInfo: TraceInfo;

    return ((rootCtx: Context | null, ...args: unknown[]) => {
      const spanId = nanoid();

      const traceIds = {
        spanId,
        parentId: (rootCtx && rootCtx.spanId) || undefined,
        traceId: (rootCtx && rootCtx.traceId) || spanId,
      };

      const log = this.log.overloadWithPrefilledData.bind(this.log)(
        traceIds
      ) as Logger;

      const ctx: Context = {
        register: (info: TraceInfo) => {
          traceInfo = info;
        },
        log,
        ...traceIds,
      };

      try {
        return func(ctx, ...args).catch((e: unknown) => {
          log.error(e as Error, "Uncaught error", traceInfo);
        });
      } catch (e: unknown) {
        log.error(e as Error, "Uncaught error", traceInfo);
      }
    }).bind(this);
  }
}
