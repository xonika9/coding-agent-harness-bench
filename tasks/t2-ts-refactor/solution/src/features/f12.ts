import { logEvent } from "../logger.ts";

export function handleF12(userId: string): string {
  logEvent({ name: "f12.done", level: "info", userId });
  return "f12:" + userId;
}
