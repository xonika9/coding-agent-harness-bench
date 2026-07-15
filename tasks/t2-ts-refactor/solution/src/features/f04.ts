import { logEvent } from "../logger.ts";

export function handleF04(userId: string): string {
  logEvent({ name: "f04.done", level: "info", userId });
  return "f04:" + userId;
}
