import { logEvent } from "../logger.ts";

export function handleF01(userId: string): string {
  logEvent({ name: "f01.done", level: "info", userId });
  return "f01:" + userId;
}
