import test from "node:test";
import assert from "node:assert/strict";
import { evalFormula } from "../src/formula.ts";

const E: Record<string, number | string> = {};

// --- strict type semantics (over-helpfulness traps) ---
test("string literal in arithmetic is #VALUE!", () => assert.equal(evalFormula('=1 + "2"', E), "#VALUE!"));
test("numeric-looking string cell not coerced", () => assert.equal(evalFormula("=A1*2", { A1: "3" }), "#VALUE!"));
test("SUM with string arg is #VALUE!", () => assert.equal(evalFormula('=SUM(1,"2")', E), "#VALUE!"));
test("SUM with string cell is #VALUE!", () => assert.equal(evalFormula("=SUM(A1:A3)", { A1: 1, A2: "x", A3: 3 }), "#VALUE!"));
test("IF string condition is #VALUE!", () => assert.equal(evalFormula('=IF("x",1,2)', E), "#VALUE!"));
test("ROUND non-integer digits is #VALUE!", () => assert.equal(evalFormula("=ROUND(1.234,1.5)", E), "#VALUE!"));
test("unary minus on string is #VALUE!", () => assert.equal(evalFormula("=-A1", { A1: "x" }), "#VALUE!"));

// --- error values are computed, not read from strings ---
test("cell string equal to error code is a plain string", () => assert.equal(evalFormula("=A1+1", { A1: "#DIV/0!" }), "#VALUE!"));
test("error string passes through IF as value", () => assert.equal(evalFormula("=IF(1,A1,5)", { A1: "#DIV/0!" }), "#DIV/0!"));

// --- error propagation, leftmost ---
test("div-by-zero propagates through +", () => assert.equal(evalFormula("=10/0 + 1", E), "#DIV/0!"));
test("leftmost error wins", () => assert.equal(evalFormula("=1/0 + BADFN(1)", E), "#DIV/0!"));
test("div by zero via expression", () => assert.equal(evalFormula("=1/(2-2)", E), "#DIV/0!"));
test("unknown function ignores arity", () => assert.equal(evalFormula("=BADFN(1,2,3,4)", E), "#NAME?"));

// --- IF lazy branch evaluation ---
test("IF does not evaluate the untaken erroring branch", () => assert.equal(evalFormula("=IF(1,5,1/0)", E), 5));
test("IF false picks else, skips then", () => assert.equal(evalFormula("=IF(0,1/0,7)", E), 7));

// --- ranges ---
test("reversed range still ascends", () => assert.equal(evalFormula("=SUM(A3:A1)", { A1: 1, A2: 2, A3: 3 }), 6));
test("multi-letter column range", () => assert.equal(evalFormula("=SUM(Z1:AB1)", { Z1: 1, AA1: 2, AB1: 3 }), 6));
test("rectangular range throws", () => assert.throws(() => evalFormula("=SUM(A1:B2)", { A1: 1 })));
test("range in non-aggregate throws", () => assert.throws(() => evalFormula("=ABS(A1:A3)", { A1: 1 })));

// --- numeric edge cases ---
test("power then unary", () => assert.equal(evalFormula("=-3^2", E), -9));
test("root via fractional power", () => assert.equal(evalFormula("=9^0.5", E), 3));
test("ROUND negative half away", () => assert.equal(evalFormula("=ROUND(-2.5,0)", E), -3));
test("ROUND exact half", () => assert.equal(evalFormula("=ROUND(0.125,2)", E), 0.13));

// --- more structural errors ---
test("double dot throws", () => assert.throws(() => evalFormula("=1..2", E)));
test("stray ampersand throws", () => assert.throws(() => evalFormula("=A1 & B1", { A1: 1, B1: 2 })));
test("number as function throws", () => assert.throws(() => evalFormula("=1(2)", E)));
test("empty parens throws", () => assert.throws(() => evalFormula("=()", E)));
test("ABS wrong arity throws", () => assert.throws(() => evalFormula("=ABS()", E)));
test("ROUND missing second arg throws", () => assert.throws(() => evalFormula("=ROUND(1)", E)));

// --- comparison strictness (over-helpfulness traps) ---
test("ordered comparison of strings is #VALUE!", () => assert.equal(evalFormula('="a"<"b"', E), "#VALUE!"));
test("ordered comparison mixed is #VALUE!", () => assert.equal(evalFormula('=1<"2"', E), "#VALUE!"));
test("number equals string is false (no coercion)", () => assert.equal(evalFormula('=1="1"', E), 0));
test("number not-equal string is true", () => assert.equal(evalFormula('=1<>"1"', E), 1));
test("comparisons are left-associative", () => assert.equal(evalFormula("=1<2<3", E), 1));
test("chained comparison with equality", () => assert.equal(evalFormula("=2<1=0", E), 1));
test("comparison binds below multiply", () => assert.equal(evalFormula("=2*3=6", E), 1));

// --- logical / count strictness ---
test("AND with string is #VALUE!", () => assert.equal(evalFormula('=AND(1,"x")', E), "#VALUE!"));
test("NOT of string is #VALUE!", () => assert.equal(evalFormula('=NOT("x")', E), "#VALUE!"));
test("AND does not short-circuit past an error", () => assert.equal(evalFormula("=AND(0,1/0)", E), "#DIV/0!"));
test("OR does not short-circuit past an error", () => assert.equal(evalFormula("=OR(0,1/0)", E), "#DIV/0!"));
test("COUNT skips strings without error", () => assert.equal(evalFormula('=COUNT(1,"x",3)', E), 2));
test("COUNT skips string cells in range", () => assert.equal(evalFormula("=COUNT(A1:A3)", { A1: 1, A2: "x", A3: 3 }), 2));
test("range in AND throws", () => assert.throws(() => evalFormula("=AND(A1:A2,1)", { A1: 1, A2: 1 })));
test("range in NOT throws", () => assert.throws(() => evalFormula("=NOT(A1:A2)", { A1: 1, A2: 1 })));
test("COUNT no args throws", () => assert.throws(() => evalFormula("=COUNT()", E)));
