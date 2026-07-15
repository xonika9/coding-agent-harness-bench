import { logEvent } from "../logger.ts";

export function handleF10(userId: string): string {
  logEvent("f10.done", "info", userId);
  return "f10:" + userId;
}
