import { logEvent } from "../logger.ts";

export function handleF09(userId: string): string {
  logEvent({ name: "f09.done", level: "info", userId });
  return "f09:" + userId;
}
