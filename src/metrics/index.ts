import { Express } from "express";
import apiMetrics from "prometheus-api-metrics";
import Prometheus from "prom-client";
import { CounterName, metricsCounters } from "./counters";
import { HistogramName, metricsHistogram } from "./histogram";

export interface MetricsHandlerOptions {
  version: string;
}

export class MetricsHandler {
  private _counters: { [key: string]: Prometheus.Counter<string> } = {};
  private _histogram: { [key: string]: Prometheus.Histogram<string> } = {};

  constructor(private options: MetricsHandlerOptions) {
    for (const counter of metricsCounters) {
      this._counters[counter.name] = new Prometheus.Counter(counter);
    }

    for (const histogram of metricsHistogram) {
      this._histogram[histogram.name] = new Prometheus.Histogram(histogram);
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

  getHistogram(name: HistogramName): Prometheus.Histogram<string> {
    return this._histogram[name];
  }
}
