import test from "node:test";
import assert from "node:assert/strict";
import { handlers } from "../src/registry.ts";
import { events, resetEvents } from "../src/logger.ts";

test("sample handler returns and logs correct record", () => {
  resetEvents();
  assert.equal(handlers.f01("u1"), "f01:u1");
  const last = events.at(-1)!;
  assert.equal(last.name, "f01.done");
  assert.equal(last.level, "info");
  assert.equal(last.userId, "u1");
});

test("f07 works too", () => {
  resetEvents();
  assert.equal(handlers.f07("bob"), "f07:bob");
  assert.equal(events.at(-1)!.userId, "bob");
});

test("all handlers log exactly once each", () => {
  resetEvents();
  const keys = Object.keys(handlers);
  for (const k of keys) handlers[k]("x");
  assert.equal(events.length, keys.length);
});
