type LogFields = Record<string, unknown>;

type LoggerOptions = {
  service: string;
};

function write(
  level: "info" | "warn" | "error",
  service: string,
  message: string,
  fields: LogFields,
) {
  const entry = {
    timestamp: new Date().toISOString(),
    level,
    service,
    message,
    ...fields,
  };

  const output = JSON.stringify(entry);
  if (level === "error") {
    console.error(output);
    return;
  }
  if (level === "warn") {
    console.warn(output);
    return;
  }
  console.log(output);
}

export function createLogger(options: LoggerOptions) {
  return {
    info: (message: string, fields: LogFields = {}) =>
      write("info", options.service, message, fields),
    warn: (message: string, fields: LogFields = {}) =>
      write("warn", options.service, message, fields),
    error: (message: string, fields: LogFields = {}) =>
      write("error", options.service, message, fields),
  };
}
