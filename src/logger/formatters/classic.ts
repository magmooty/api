import {
  LogData,
  LogMessageOptions,
  MessageFormatter,
  MessageFormatterOptions,
} from "@/logger";
import moment from "moment";

export class ClassicMessageFormatter implements MessageFormatter {
  constructor(private options: MessageFormatterOptions) {}

  format(
    { level }: LogMessageOptions,
    message: string,
    data: LogData = {}
  ): string {
    const timestamp = moment().utc().format(this.options.timestampFormat);
    const { service, version } = this.options;
    return JSON.stringify({
      timestamp,
      service,
      version,
      level: level.toUpperCase(),
      message,
      data,
    });
  }
}
