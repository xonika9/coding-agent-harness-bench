import { logEvent } from "../logger.ts";

export function handleF06(userId: string): string {
  logEvent("f06.done", "info", userId);
  return "f06:" + userId;
}
