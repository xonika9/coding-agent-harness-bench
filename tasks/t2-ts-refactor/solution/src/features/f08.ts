import { logEvent } from "../logger.ts";

export function handleF08(userId: string): string {
  logEvent({ name: "f08.done", level: "info", userId });
  return "f08:" + userId;
}
