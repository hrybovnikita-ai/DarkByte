type LogLevel = "debug" | "info" | "warn" | "error";

function log(level: LogLevel, message: string, extra?: Record<string, unknown>) {
  const payload = {
    level,
    message,
    time: new Date().toISOString(),
    ...extra,
  };
  const line = JSON.stringify(payload);
  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    console.log(line);
  }
}

export const logger = {
  debug: (message: string, extra?: Record<string, unknown>) =>
    log("debug", message, extra),
  info: (message: string, extra?: Record<string, unknown>) =>
    log("info", message, extra),
  warn: (message: string, extra?: Record<string, unknown>) =>
    log("warn", message, extra),
  error: (message: string, extra?: Record<string, unknown>) =>
    log("error", message, extra),
};