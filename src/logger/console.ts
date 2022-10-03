import { isTesting } from "@/config";
import { LogData, Logger, MessageFormatter } from "@/logger";
import toJSON from "@stdlib/error-to-json";

export class ConsoleLogger implements Logger {
  constructor(private formatter: MessageFormatter) {}

  debug(message: string, data?: any) {
    const formatted = JSON.stringify(data, null, 2);
    console.debug(`\x1b[34m${message} ${formatted}\x1b[0m`);
  }

  info(message: string, data?: LogData) {
    if (!isTesting) {
      console.info(this.formatter.format({ level: "info" }, message, data));
    }
  }

  warn(message: string, data?: LogData) {
    if (!isTesting) {
      console.warn(this.formatter.format({ level: "warn" }, message, data));
    }
  }

  error(error: Error | Object | unknown, message: string, data?: LogData) {
    if (!isTesting) {
      let logData;

      if (error instanceof Error) {
        logData = {
          ...data,
          error: toJSON(error),
        };
      } else {
        logData = {
          ...data,
          error,
        };
      }

      console.error(
        this.formatter.format({ level: "error" }, message, logData as Object)
      );
    }
  }

  overloadWithPrefilledData(prefilledData: Object): Logger {
    return {
      debug: (message, data?) => {
        this.debug(message, { ...data, ...prefilledData });
      },
      info: (message, data?) => {
        this.info(message, { ...data, ...prefilledData });
      },
      warn: (message, data?) => {
        this.warn(message, { ...data, ...prefilledData });
      },
      error: (error, message, data?) => {
        this.error(error, message, { ...data, ...prefilledData });
      },
      overloadWithPrefilledData: () => {
        return null;
      },
    };
  }
}
