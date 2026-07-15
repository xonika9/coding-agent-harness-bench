import { logEvent } from "../logger.ts";

export function handleF02(userId: string): string {
  logEvent({ name: "f02.done", level: "info", userId });
  return "f02:" + userId;
}
