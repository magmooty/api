interface Logger {
  debug: (message: string, data: Map<string | number, unknown>) => void;
  verbose: (message: string, data: Map<string | number, unknown>) => void;
  info: (message: string, data: Map<string | number, unknown>) => void;
  warn: (message: string, data: Map<string | number, unknown>) => void;
  error: (message: string, data: Map<string | number, unknown>) => void;
}
