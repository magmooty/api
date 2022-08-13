// Config
import config from "@/config";

// Info
const version = process.env.npm_package_version as string;

// Logger
import { ConsoleLogger } from "@/logger/console";
import { ClassicMessageFormatter } from "@/logger/formatters/classic";

const classMessageFormatter = new ClassicMessageFormatter({
  service: "api",
  version,
  timestampFormat: "YYYY-MM-DD HH:mm:ss",
});

const log = new ConsoleLogger(classMessageFormatter);

// Metrics
import { MetricsHandler } from "./metrics";

const metrics = new MetricsHandler({ version });

// Tracing
import { Tracer } from "@/tracing";

const tracer = new Tracer({ log, metrics });
const wrapper = tracer.wrapper.bind(tracer);

// Errors
import { ErrorThrower } from "./errors";

const errors = new ErrorThrower();

// Persistence
import { Persistence } from "./persistence";

const persistence = new Persistence(config.persistence);

// Message queue
import { createQueueDriver } from "@/queue";

const queue = createQueueDriver(config.queue);

// Message queue
import { createSyncDriver, SyncDriver } from "@/sync";

const sync = createSyncDriver(config.sync) as SyncDriver;

export { wrapper, metrics, config, persistence, errors, queue, sync };
