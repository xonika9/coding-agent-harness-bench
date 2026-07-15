import { logEvent } from "../logger.ts";

export function handleF12(userId: string): string {
  logEvent("f12.done", "info", userId);
  return "f12:" + userId;
}
