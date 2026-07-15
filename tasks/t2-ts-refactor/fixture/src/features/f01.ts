import { logEvent } from "../logger.ts";

export function handleF01(userId: string): string {
  logEvent("f01.done", "info", userId);
  return "f01:" + userId;
}
