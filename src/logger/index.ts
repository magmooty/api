export type LogLevel = "debug" | "info" | "warn" | "error";

export type LogData = Object;

export interface LogMessageOptions {
  level: LogLevel;
  stripped?: boolean;
}

export interface MessageFormatterOptions {
  service: string;
  version: string;
  timestampFormat: string;
}

export interface MessageFormatter {
  format(options: LogMessageOptions, message: string, data?: LogData): string;
}

export type LoggerDebug = (message: string, data?: any) => void;

export interface Logger {
  debug: LoggerDebug;
  info: (message: string, data?: LogData) => void;
  warn: (message: string, data?: LogData) => void;
  error: (
    error: Error | Object | unknown,
    message: string,
    data?: LogData
  ) => void;
  overloadWithPrefilledData(prefilledData: Object): Logger | unknown;
}
