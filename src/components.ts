import { ConsoleLogger } from "@/logger/console";
import { ClassicMessageFormatter } from "@/logger/formatters/classic";
import { Tracer } from "@/tracing";
import { MetricsHandler } from "./metrics";

// Info
const version = process.env.npm_package_version as string;

// Logger
const classMessageFormatter = new ClassicMessageFormatter({
  service: "api",
  version,
  timestampFormat: "YYYY-MM-DD HH:mm:ss",
});

const log = new ConsoleLogger(classMessageFormatter);

// Metrics
const metrics = new MetricsHandler({ version });

// Tracing
const tracer = new Tracer({ log, metrics });
const wrapper = tracer.wrapper.bind(tracer);

export { wrapper, metrics };
