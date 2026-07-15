import { logEvent } from "../logger.ts";

export function handleF06(userId: string): string {
  logEvent({ name: "f06.done", level: "info", userId });
  return "f06:" + userId;
}
