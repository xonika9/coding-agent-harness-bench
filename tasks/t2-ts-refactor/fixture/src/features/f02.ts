import { logEvent } from "../logger.ts";

export function handleF02(userId: string): string {
  logEvent("f02.done", "info", userId);
  return "f02:" + userId;
}
