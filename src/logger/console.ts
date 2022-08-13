import { LogData, Logger, MessageFormatter } from "@/logger";
import toJSON from "@stdlib/error-to-json";

export class ConsoleLogger implements Logger {
  constructor(private formatter: MessageFormatter) {}

  debug(message: string, data?: LogData) {
    console.debug(this.formatter.format({ level: "debug" }, message, data));
  }

  info(message: string, data?: LogData) {
    console.info(this.formatter.format({ level: "info" }, message, data));
  }

  warn(message: string, data?: LogData) {
    console.warn(this.formatter.format({ level: "warn" }, message, data));
  }

  error(error: Error | Object | unknown, message: string, data?: LogData) {
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
