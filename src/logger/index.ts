export type LogLevel = "debug" | "info" | "warn" | "error";

export type LogData = Object;

export interface LogMessageOptions {
  level: LogLevel;
}

export interface LogMessage {
  timestamp: string;
  level: LogLevel;
  [key: string]: unknown;
}

export interface MessageFormatterOptions {
  service: string;
  version: string;
  timestampFormat: string;
}

export interface MessageFormatter {
  format(
    options: LogMessageOptions,
    message: string,
    data?: LogData
  ): LogMessage;
}

export interface Logger {
  debug: (message: string, data?: LogData) => void;
  info: (message: string, data?: LogData) => void;
  warn: (message: string, data?: LogData) => void;
  error: (error: Error, message: string, data?: LogData) => void;
  overloadWithPrefilledData(prefilledData: Object): Logger | unknown;
}
