import { APINextFunction, APIRequest, APIResponse } from "@/api/types";
import config from "@/config";
import { AppLocale } from "@/graph/objects/types";
import { Logger } from "@/logger";
import { MetricsHandler } from "@/metrics";
import { HistogramName } from "@/metrics/histogram";
import { parse as parseAcceptLanguage } from "@escapace/accept-language-parser";
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
  file: string;
  locale: AppLocale;
  data?: Object;
}

interface RegisterTraceInfo {
  name: string;
  file: string;
  locale?: AppLocale;
  data?: Object;
  isAPIEndpoint?: boolean;
}

type RegisterFunction = (info: Object) => void;

interface LocalDurationMetric {
  name: HistogramName;
  labels: { [key: string]: string | number };
}

interface LocalTrackingMetrics {
  durationMetric?: LocalDurationMetric;
  errorDurationMetric?: LocalDurationMetric;
}

export interface RootContext {
  traceInfo: {
    locale: AppLocale;
  };
  traceId: string;
  spanId: string;
  parentId?: string;
}

export interface Context {
  log: Logger;
  register: RegisterFunction;
  traceId: string;
  spanId: string;
  parentId?: string;
  metrics: MetricsHandler;
  setLocale: (locale: AppLocale) => void;
  getParam: (name: string) => any;
  setParam: (name: string, value: any) => any;
  traceInfo: TraceInfo;
  startTrackTime: (
    durationMetric: HistogramName,
    errorDurationMetric: HistogramName
  ) => void;
  setDurationMetricLabels: (labels: { [key: string]: string | number }) => void;
  setErrorDurationMetricLabels: (labels: {
    [key: string]: string | number;
  }) => void;
  fatal: (message: string, data?: Object) => void;
}

export interface TracerOptions {
  log: Logger;
  metrics: MetricsHandler;
}

export class Tracer {
  constructor(private options: TracerOptions) {}

  apiWrapper<T extends (...args: any[]) => any>(
    info: RegisterTraceInfo,
    func: T,
    errorCb?: (ctx: Context, error: Error) => void,
    successCb?: (ctx: Context, result: ExtractReturnType<T>) => void
  ): <G = ExtractReturnType<T>>(
    ...funcArgs: ExtractParametersWithoutFirstParam<T>
  ) => G extends never ? ExtractReturnType<T> : G {
    const handler = this.wrapper(
      { ...info, name: `[ENDPOINT] ${info.name}`, isAPIEndpoint: true },
      func,
      errorCb,
      successCb
    );

    return (...args: any) => handler(null, ...args);
  }

  wrapper<T extends (...args: any[]) => any>(
    { name, file, isAPIEndpoint }: RegisterTraceInfo,
    func: T,
    errorCb?: (ctx: Context, error: Error) => void,
    successCb?: (ctx: Context, result: ExtractReturnType<T>) => void
  ): <G = ExtractReturnType<T>>(
    rootCtx?: Context | RootContext | null,
    ...funcArgs: ExtractParametersWithoutFirstParam<T>
  ) => G extends never ? ExtractReturnType<T> : G {
    return ((rootCtx?: Context | RootContext | null, ...args: unknown[]) => {
      const traceInfo: TraceInfo = {
        name,
        file,
        locale: rootCtx?.traceInfo.locale || config.i18n.defaultLocale,
      };

      const spanId = nanoid();

      const traceIds = {
        spanId,
        parentId: (rootCtx && rootCtx.spanId) || undefined,
        traceId: (rootCtx && rootCtx.traceId) || spanId,
      };

      const log = this.options.log.overloadWithPrefilledData.bind(
        this.options.log
      )(traceIds) as Logger;

      let trackingMetrics: LocalTrackingMetrics = {};

      let end: any;
      let errorEnd: any;

      const ctx: Context = {
        register: (data: Object) => {
          traceInfo.data = data;
          log.info(`${name} register`, data);
        },
        setLocale: (locale: AppLocale) => {
          traceInfo.locale = locale;
        },
        startTrackTime: (durationMetric, errorDurationMetric) => {
          trackingMetrics = {
            durationMetric: { name: durationMetric, labels: {} },
            errorDurationMetric: { name: errorDurationMetric, labels: {} },
          };

          end = trackingMetrics.durationMetric
            ? ctx.metrics
                .getHistogram(trackingMetrics.durationMetric.name)
                .startTimer()
            : null;

          errorEnd = trackingMetrics.errorDurationMetric
            ? ctx.metrics
                .getHistogram(trackingMetrics.errorDurationMetric.name)
                .startTimer()
            : null;
        },
        setDurationMetricLabels: (labels) => {
          if (trackingMetrics.durationMetric) {
            trackingMetrics.durationMetric.labels = labels;
          }
        },
        setErrorDurationMetricLabels: (labels) => {
          if (trackingMetrics.errorDurationMetric) {
            trackingMetrics.errorDurationMetric.labels = labels;
          }
        },
        getParam: (name: string) => (traceInfo as any)[name],
        setParam: (name: string, value: string | number) =>
          ((traceInfo as any)[name] = value),
        log,
        metrics: this.options.metrics,
        fatal: (message: string, data?: Object) => {
          log.error(data, `FATAL ERROR: ${message}`);
          process.exit();
        },
        traceInfo,
        ...traceIds,
      };

      if (isAPIEndpoint) {
        const req = args[0] as APIRequest;
        const res = args[1] as APIResponse;

        const acceptLanguageHeader =
          req.headers["accept-language"] || config.i18n.defaultLocale;

        const locale = parseAcceptLanguage(acceptLanguageHeader)[0].code;

        ctx.setLocale(locale as AppLocale);
        req.ctx = ctx;
        res.header("X-Trace-Id", traceIds.traceId);

        const { query, body, headers, path, params } = req;

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { password, ...strippedBody } = body;

        log.info(`${name} request`, {
          query,
          body: strippedBody,
          headers,
          path,
          params,
        });
      }

      try {
        log.info(`${name} start`);

        return func(ctx, ...args)
          .then(async (result: ExtractReturnType<T>) => {
            ctx.log.info(`${name} successful`);

            try {
              if (successCb) {
                await successCb(ctx, result);
              }
            } catch {}

            if (end && trackingMetrics.durationMetric) {
              ctx.metrics
                .getHistogram(trackingMetrics.durationMetric.name)
                .observe(end(trackingMetrics.durationMetric.labels));
            }

            return result;
          })
          .catch(async (e: unknown) => {
            log.error(
              e as Error,
              (e as Error).message || "Uncaught error",
              traceInfo
            );

            try {
              if (errorCb) {
                await errorCb(ctx, e as Error);
              }
            } catch {}

            if (errorEnd && trackingMetrics.errorDurationMetric) {
              ctx.metrics
                .getHistogram(trackingMetrics.errorDurationMetric.name)
                .observe(
                  errorEnd({
                    error: (e as Error).message,
                    ...trackingMetrics.errorDurationMetric.labels,
                  })
                );
            }

            console.log({ ctx, e });

            if (ctx.parentId) {
              throw e;
            }

            if (isAPIEndpoint) {
              const next = args[2] as APINextFunction;
              next(e);
            }
          });
      } catch (e: unknown) {
        log.error(
          e as Error,
          (e as Error).message || "Uncaught error",
          traceInfo
        );

        try {
          if (errorCb) {
            errorCb(ctx, e as Error);
          }
        } catch {}

        if (errorEnd && trackingMetrics.errorDurationMetric) {
          ctx.metrics
            .getHistogram(trackingMetrics.errorDurationMetric.name)
            .observe(
              errorEnd({
                error: (e as Error).message,
                ...trackingMetrics.errorDurationMetric.labels,
              })
            );
        }

        if (ctx.parentId) {
          throw e;
        }

        if (isAPIEndpoint) {
          const next = args[2] as APINextFunction;
          next(e);
        }
      }
    }).bind(this);
  }
}
