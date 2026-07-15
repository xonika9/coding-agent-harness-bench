import { logEvent } from "../logger.ts";

export function handleF11(userId: string): string {
  logEvent({ name: "f11.done", level: "info", userId });
  return "f11:" + userId;
}
