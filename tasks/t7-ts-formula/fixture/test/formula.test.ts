import test from "node:test";
import assert from "node:assert/strict";
import { evalFormula } from "../src/formula.ts";

const E: Record<string, number | string> = {};

// --- literals & arithmetic ---
test("number literal", () => assert.equal(evalFormula("=42", E), 42));
test("decimal literal", () => assert.equal(evalFormula("=3.5", E), 3.5));
test("addition", () => assert.equal(evalFormula("=1+2", E), 3));
test("precedence * over +", () => assert.equal(evalFormula("=1+2*3", E), 7));
test("parentheses", () => assert.equal(evalFormula("=(1+2)*3", E), 9));
test("subtraction chain", () => assert.equal(evalFormula("=10-3-2", E), 5));
test("division", () => assert.equal(evalFormula("=10/4", E), 2.5));
test("power right-assoc", () => assert.equal(evalFormula("=2^3^2", E), 512));
test("unary minus", () => assert.equal(evalFormula("=-5+2", E), -3));
test("power binds tighter than unary minus", () => assert.equal(evalFormula("=-2^2", E), -4));
test("negative exponent", () => assert.equal(evalFormula("=2^-2", E), 0.25));
test("whitespace ignored", () => assert.equal(evalFormula("=  1 +  2 ", E), 3));

// --- cells ---
test("cell ref", () => assert.equal(evalFormula("=A1", { A1: 10 }), 10));
test("cell arithmetic", () => assert.equal(evalFormula("=A1+B1", { A1: 10, B1: 5 }), 15));
test("missing cell is zero", () => assert.equal(evalFormula("=A9+1", E), 1));
test("string cell value", () => assert.equal(evalFormula("=A1", { A1: "hello" }), "hello"));

// --- strings ---
test("string literal", () => assert.equal(evalFormula('="hello"', E), "hello"));

// --- functions ---
test("SUM scalars", () => assert.equal(evalFormula("=SUM(1,2,3)", E), 6));
test("SUM range", () => assert.equal(evalFormula("=SUM(A1:A3)", { A1: 1, A2: 2, A3: 3 }), 6));
test("SUM range with gap", () => assert.equal(evalFormula("=SUM(A1:A3)", { A1: 1, A3: 3 }), 4));
test("AVG", () => assert.equal(evalFormula("=AVG(2,4)", E), 3));
test("AVG range", () => assert.equal(evalFormula("=AVG(A1:A4)", { A1: 2, A2: 4, A3: 6, A4: 8 }), 5));
test("MIN", () => assert.equal(evalFormula("=MIN(3,1,2)", E), 1));
test("MAX", () => assert.equal(evalFormula("=MAX(3,1,2)", E), 3));
test("MIN row range", () => assert.equal(evalFormula("=MIN(A1:C1)", { A1: 5, B1: 2, C1: 8 }), 2));
test("ABS", () => assert.equal(evalFormula("=ABS(-5)", E), 5));
test("ROUND to 2 dp", () => assert.equal(evalFormula("=ROUND(1.2345,2)", E), 1.23));
test("ROUND half away from zero", () => assert.equal(evalFormula("=ROUND(2.5,0)", E), 3));
test("IF true", () => assert.equal(evalFormula("=IF(1,10,20)", E), 10));
test("IF false", () => assert.equal(evalFormula("=IF(0,10,20)", E), 20));
test("IF with string branch", () => assert.equal(evalFormula('=IF(A1,"yes","no")', { A1: 1 }), "yes"));
test("nested functions", () => assert.equal(evalFormula("=SUM(1,MAX(2,3),ABS(-4))", E), 8));

// --- error values (returned, not thrown) ---
test("div by zero", () => assert.equal(evalFormula("=10/0", E), "#DIV/0!"));
test("arithmetic on string is #VALUE!", () => assert.equal(evalFormula("=A1+1", { A1: "x" }), "#VALUE!"));
test("unknown function is #NAME?", () => assert.equal(evalFormula("=BAR(1)", E), "#NAME?"));
test("lowercase function is #NAME?", () => assert.equal(evalFormula("=sum(1,2)", E), "#NAME?"));

// --- structural errors (throw) ---
test("empty throws", () => assert.throws(() => evalFormula("", E)));
test("no equals throws", () => assert.throws(() => evalFormula("1+2", E)));
test("dangling operator throws", () => assert.throws(() => evalFormula("=1+", E)));
test("unbalanced paren throws", () => assert.throws(() => evalFormula("=(1+2", E)));
test("SUM no args throws", () => assert.throws(() => evalFormula("=SUM()", E)));
test("IF wrong arity throws", () => assert.throws(() => evalFormula("=IF(1,2)", E)));
test("range outside function throws", () => assert.throws(() => evalFormula("=A1:A3", { A1: 1 })));

// --- comparisons (return 1/0) ---
test("less than true", () => assert.equal(evalFormula("=1<2", E), 1));
test("less than false", () => assert.equal(evalFormula("=2<2", E), 0));
test("greater-equal", () => assert.equal(evalFormula("=3>=3", E), 1));
test("numeric equality true", () => assert.equal(evalFormula("=1=1", E), 1));
test("not-equal", () => assert.equal(evalFormula("=1<>2", E), 1));
test("string equality", () => assert.equal(evalFormula('="a"="a"', E), 1));
test("string inequality", () => assert.equal(evalFormula('="a"="b"', E), 0));
test("comparison lower precedence than plus", () => assert.equal(evalFormula("=1+2>2", E), 1));
test("IF with comparison condition", () => assert.equal(evalFormula('=IF(A1>10,"big","small")', { A1: 20 }), "big"));

// --- logical & count ---
test("AND all true", () => assert.equal(evalFormula("=AND(1,1,1)", E), 1));
test("AND with a false", () => assert.equal(evalFormula("=AND(1,0,1)", E), 0));
test("OR any true", () => assert.equal(evalFormula("=OR(0,0,1)", E), 1));
test("OR all false", () => assert.equal(evalFormula("=OR(0,0,0)", E), 0));
test("NOT zero", () => assert.equal(evalFormula("=NOT(0)", E), 1));
test("NOT nonzero", () => assert.equal(evalFormula("=NOT(5)", E), 0));
test("COUNT scalars", () => assert.equal(evalFormula("=COUNT(1,2,3)", E), 3));
test("COUNT range", () => assert.equal(evalFormula("=COUNT(A1:A3)", { A1: 1, A2: 2, A3: 3 }), 3));
test("COUNT counts empty as number", () => assert.equal(evalFormula("=COUNT(A1:A3)", { A1: 1, A3: 3 }), 3));
