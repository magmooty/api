import {
  LogData,
  LogMessage,
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
  ): LogMessage {
    const timestamp = moment().utc().format(this.options.timestampFormat);
    const { service, version } = this.options;
    return { timestamp, service, version, level, ...data };
  }
}
