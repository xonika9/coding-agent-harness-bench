import { logEvent } from "../logger.ts";

export function handleF05(userId: string): string {
  logEvent({ name: "f05.done", level: "info", userId });
  return "f05:" + userId;
}
