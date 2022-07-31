import { Express } from "express";
import apiMetrics from "prometheus-api-metrics";
import Prometheus from "prom-client";
import { CounterName, metricsCounters } from "./counters";

export interface MetricsHandlerOptions {
  version: string;
}

export class MetricsHandler {
  private _counters: { [key: string]: Prometheus.Counter<string> } = {};

  constructor(private options: MetricsHandlerOptions) {
    for (const counter of metricsCounters) {
      this._counters[counter.name] = new Prometheus.Counter(counter);
    }
  }

  installApp(app: Express) {
    app.use(
      apiMetrics({
        additionalLabels: ["version"],
        extractAdditionalLabelValuesFn: () => ({
          version: this.options.version,
        }),
      })
    );
  }

  getCounter(name: CounterName): Prometheus.Counter<string> {
    return this._counters[name];
  }
}
