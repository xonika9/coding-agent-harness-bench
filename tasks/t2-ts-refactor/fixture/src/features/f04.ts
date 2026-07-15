import { logEvent } from "../logger.ts";

export function handleF04(userId: string): string {
  logEvent("f04.done", "info", userId);
  return "f04:" + userId;
}
