import { logEvent } from "../logger.ts";

export function handleF07(userId: string): string {
  logEvent("f07.done", "info", userId);
  return "f07:" + userId;
}
