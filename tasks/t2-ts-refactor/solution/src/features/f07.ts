import { logEvent } from "../logger.ts";

export function handleF07(userId: string): string {
  logEvent({ name: "f07.done", level: "info", userId });
  return "f07:" + userId;
}
