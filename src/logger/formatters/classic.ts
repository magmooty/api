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
    { level, stripped }: LogMessageOptions,
    message: string,
    data: LogData = {}
  ): string {
    const timestamp = moment().utc().format(this.options.timestampFormat);
    const { service, version } = this.options;

    if (stripped) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { spanId, parentId, traceId, ...strippedData } = data as any;
      return JSON.stringify({ message, data: strippedData }, null, 2);
    }

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
