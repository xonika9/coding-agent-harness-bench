import { logEvent } from "../logger.ts";

export function handleF05(userId: string): string {
  logEvent("f05.done", "info", userId);
  return "f05:" + userId;
}
