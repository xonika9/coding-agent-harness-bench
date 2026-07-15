import type { Level } from "./level.ts";

export interface LogRecord { name: string; level: Level; userId: string; seq: number; }

const sink: LogRecord[] = [];
let counter = 0;

export function logEvent(name: string, level: Level, userId: string): LogRecord {
  const rec: LogRecord = { name, level, userId, seq: counter++ };
  sink.push(rec);
  return rec;
}

export const events: readonly LogRecord[] = sink;
export function resetEvents(): void { sink.length = 0; counter = 0; }
