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
const apiWrapper = tracer.apiWrapper.bind(tracer);

// Errors
import { ErrorThrower } from "./errors";

const errors = new ErrorThrower();

// Value sets
import { ValueSets } from "./value-sets";

const valueSets = new ValueSets();

// Persistence
import { Persistence } from "./persistence";

const persistence = new Persistence(config.persistence);

// Message queue
import { createQueueDriver } from "@/queue";

const queue = createQueueDriver(config.queue);

// Message queue
import { createSyncDriver, SyncDriver } from "@/sync";

const sync = createSyncDriver(config.sync) as SyncDriver;

// Search
import { createSearchDriver, SearchDriver } from "@/search";

const search = createSearchDriver(config.search) as SearchDriver;

// Auth
import { createAuthDriver, AuthDriver } from "@/auth";

const auth = createAuthDriver(config.auth, search) as AuthDriver;

// Services
import { twilio } from "@/services/twilio";

const services = { twilio };

// Parallel logic
import { ParallelLogic } from "./parallel-logic";

const parallelLogic = new ParallelLogic();

// Sync logic
import { SyncLogic } from "./sync-logic";

const syncLogic = new SyncLogic();

export {
  apiWrapper,
  wrapper,
  metrics,
  config,
  valueSets,
  persistence,
  errors,
  queue,
  sync,
  search,
  auth,
  services,
  parallelLogic,
  syncLogic,
};
