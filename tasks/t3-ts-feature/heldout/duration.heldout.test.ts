import test from "node:test";
import assert from "node:assert/strict";
import { parseDuration } from "../src/duration.ts";

test("days", () => assert.equal(parseDuration("1d"), 86400000));
test("multi-token sum", () => assert.equal(parseDuration("1h30m15s"), 5415000));
test("ms plus hours", () => assert.equal(parseDuration("1h1ms"), 3600001));
test("trims surrounding whitespace", () => assert.equal(parseDuration("  2m  "), 120000));
test("zero", () => assert.equal(parseDuration("0s"), 0));
test("empty throws", () => assert.throws(() => parseDuration("")));
test("missing unit throws", () => assert.throws(() => parseDuration("10")));
test("garbage throws", () => assert.throws(() => parseDuration("abc")));
test("unknown unit throws", () => assert.throws(() => parseDuration("5x")));
test("decimal throws", () => assert.throws(() => parseDuration("1.5h")));
