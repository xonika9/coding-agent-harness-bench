import test from "node:test";
import assert from "node:assert/strict";
import { parseQuery, applyFilter } from "../src/filter.ts";

test("string equality filter", () => {
  assert.deepEqual(applyFilter([{ city: "Berlin" }, { city: "Paris" }], "city=Berlin"), [{ city: "Berlin" }]);
});
test("numeric >= filter", () => {
  assert.deepEqual(applyFilter([{ age: 17 }, { age: 18 }, { age: 20 }], "age>=18"), [{ age: 18 }, { age: 20 }]);
});
test("AND of two conditions", () => {
  const rows = [{ age: 20, city: "Berlin" }, { age: 20, city: "Paris" }, { age: 16, city: "Berlin" }];
  assert.deepEqual(applyFilter(rows, "age>=18 AND city=Berlin"), [{ age: 20, city: "Berlin" }]);
});
test("parseQuery returns conditions", () => {
  assert.equal(parseQuery("age>=18 AND city=Berlin").length, 2);
});
