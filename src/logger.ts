export type LogLevel = "debug" | "info" | "warn" | "error";

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

export interface Logger {
  debug(...msg: unknown[]): void;
  info(...msg: unknown[]): void;
  warn(...msg: unknown[]): void;
  error(...msg: unknown[]): void;
}

function normalizeLevel(value: string | undefined): LogLevel {
  const v = (value ?? "info").toLowerCase();
  if (v === "debug" || v === "info" || v === "warn" || v === "error") {
    return v;
  }
  return "info";
}

// Minimal console-based logger. Replaces @slack/logger from the Slack version
// so reused modules (e.g. deepl.ts) keep a familiar Logger interface.
export function createLogger(level?: string): Logger {
  const threshold = LEVEL_ORDER[normalizeLevel(level ?? process.env.LOG_LEVEL)];

  const log = (lvl: LogLevel, fn: (...m: unknown[]) => void, msg: unknown[]) => {
    if (LEVEL_ORDER[lvl] < threshold) return;
    fn(`[${new Date().toISOString()}] [${lvl.toUpperCase()}]`, ...msg);
  };

  return {
    debug: (...m) => log("debug", console.debug, m),
    info: (...m) => log("info", console.info, m),
    warn: (...m) => log("warn", console.warn, m),
    error: (...m) => log("error", console.error, m),
  };
}
