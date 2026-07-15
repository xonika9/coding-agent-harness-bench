import { logEvent } from "../logger.ts";

export function handleF03(userId: string): string {
  logEvent("f03.done", "info", userId);
  return "f03:" + userId;
}
