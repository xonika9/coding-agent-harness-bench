import { logEvent } from "../logger.ts";

export function handleF10(userId: string): string {
  logEvent({ name: "f10.done", level: "info", userId });
  return "f10:" + userId;
}
