import { logEvent } from "../logger.ts";

export function handleF08(userId: string): string {
  logEvent("f08.done", "info", userId);
  return "f08:" + userId;
}
