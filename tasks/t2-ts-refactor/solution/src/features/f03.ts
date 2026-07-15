import { logEvent } from "../logger.ts";

export function handleF03(userId: string): string {
  logEvent({ name: "f03.done", level: "info", userId });
  return "f03:" + userId;
}
