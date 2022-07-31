import { ConsoleLogger } from "@/logger/console";
import { ClassicMessageFormatter } from "@/logger/formatters/classic";
import { Tracer } from "@/tracing";

// Logger
const classMessageFormatter = new ClassicMessageFormatter({
  service: "api",
  version: process.env.npm_package_version as string,
  timestampFormat: "YYYY-MM-DD HH:mm:ss",
});

const logger = new ConsoleLogger(classMessageFormatter);

// Tracing
const tracer = new Tracer(logger);
const wrapper = tracer.wrapper.bind(tracer);

export { logger, wrapper };
