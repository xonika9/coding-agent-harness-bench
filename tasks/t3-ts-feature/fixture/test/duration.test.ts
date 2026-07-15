import test from "node:test";
import assert from "node:assert/strict";
import { parseDuration } from "../src/duration.ts";

test("milliseconds", () => assert.equal(parseDuration("500ms"), 500));
test("seconds", () => assert.equal(parseDuration("1s"), 1000));
test("minutes", () => assert.equal(parseDuration("2m"), 120000));
test("hours", () => assert.equal(parseDuration("1h"), 3600000));
test("hours+minutes", () => assert.equal(parseDuration("1h30m"), 5400000));
