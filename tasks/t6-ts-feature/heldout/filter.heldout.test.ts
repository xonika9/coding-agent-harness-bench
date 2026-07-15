import test from "node:test";
import assert from "node:assert/strict";
import { parseQuery, applyFilter } from "../src/filter.ts";

test("not-equal", () => assert.deepEqual(applyFilter([{ c: "B" }, { c: "P" }], "c!=B"), [{ c: "P" }]));
test("strict less-than", () => assert.deepEqual(applyFilter([{ a: 17 }, { a: 18 }], "a<18"), [{ a: 17 }]));
test("range with > and <=", () => assert.deepEqual(applyFilter([{ a: 5 }, { a: 10 }, { a: 15 }], "a>5 AND a<=10"), [{ a: 10 }]));
test("missing field excludes row", () => assert.deepEqual(applyFilter([{ score: 9 }, { name: "x" }], "score>5"), [{ score: 9 }]));
test("numeric equality", () => assert.deepEqual(applyFilter([{ age: 18 }, { age: 19 }], "age=18"), [{ age: 18 }]));
test("whitespace tolerated", () => assert.equal(parseQuery("  age >= 18  ").length, 1));
test("empty throws", () => assert.throws(() => parseQuery("")));
test("missing operator throws", () => assert.throws(() => parseQuery("age")));
test("empty value throws", () => assert.throws(() => parseQuery("age=")));
test("missing field throws", () => assert.throws(() => parseQuery("=5")));
test("unknown operator throws", () => assert.throws(() => parseQuery("age~5")));
test("bad field name throws", () => assert.throws(() => parseQuery("1age=5")));
