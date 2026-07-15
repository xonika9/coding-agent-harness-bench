import { logEvent } from "../logger.ts";

export function handleF09(userId: string): string {
  logEvent("f09.done", "info", userId);
  return "f09:" + userId;
}
