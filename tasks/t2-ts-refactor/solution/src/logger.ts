import type { Level } from "./level.ts";

export interface LogRecord { name: string; level: Level; userId: string; seq: number; }
export interface LogEventInput { name: string; level: Level; userId: string; }

const sink: LogRecord[] = [];
let counter = 0;

export function logEvent(event: LogEventInput): LogRecord {
  const rec: LogRecord = { name: event.name, level: event.level, userId: event.userId, seq: counter++ };
  sink.push(rec);
  return rec;
}

export const events: readonly LogRecord[] = sink;
export function resetEvents(): void { sink.length = 0; counter = 0; }
