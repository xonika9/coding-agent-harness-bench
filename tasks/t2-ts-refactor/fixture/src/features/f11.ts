import { logEvent } from "../logger.ts";

export function handleF11(userId: string): string {
  logEvent("f11.done", "info", userId);
  return "f11:" + userId;
}
