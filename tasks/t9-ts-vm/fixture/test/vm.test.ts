import { test } from "node:test";
import assert from "node:assert/strict";
import { run } from "../src/vm.ts";

const out = (p: string) => run(p).output;
const stk = (p: string) => run(p).stack;

test("empty program", () => {
  assert.deepEqual(run(""), { output: [], stack: [] });
  assert.deepEqual(run("\n\n   \n# just a comment\n"), { output: [], stack: [] });
});

test("push and final stack order", () => {
  assert.deepEqual(stk("PUSH 1\nPUSH 2\nPUSH 3"), [1, 2, 3]);
});

test("print consumes top", () => {
  assert.deepEqual(run("PUSH 7\nPRINT"), { output: [7], stack: [] });
});

test("add sub mul", () => {
  assert.deepEqual(stk("PUSH 2\nPUSH 3\nADD"), [5]);
  assert.deepEqual(stk("PUSH 10\nPUSH 4\nSUB"), [6]);
  assert.deepEqual(stk("PUSH 6\nPUSH 7\nMUL"), [42]);
});

test("sub operand order is a - b", () => {
  assert.deepEqual(stk("PUSH 3\nPUSH 10\nSUB"), [-7]);
});

test("div truncates toward zero", () => {
  assert.deepEqual(stk("PUSH 7\nPUSH 2\nDIV"), [3]);
  assert.deepEqual(stk("PUSH -7\nPUSH 2\nDIV"), [-3]);
  assert.deepEqual(stk("PUSH 7\nPUSH -2\nDIV"), [-3]);
});

test("mod sign follows dividend", () => {
  assert.deepEqual(stk("PUSH 7\nPUSH 3\nMOD"), [1]);
  assert.deepEqual(stk("PUSH -7\nPUSH 3\nMOD"), [-1]);
  assert.deepEqual(stk("PUSH 7\nPUSH -3\nMOD"), [1]);
});

test("neg", () => {
  assert.deepEqual(stk("PUSH 5\nNEG"), [-5]);
});

test("comparisons push 1 or 0", () => {
  assert.deepEqual(stk("PUSH 2\nPUSH 3\nLT"), [1]);
  assert.deepEqual(stk("PUSH 3\nPUSH 3\nLT"), [0]);
  assert.deepEqual(stk("PUSH 3\nPUSH 3\nLE"), [1]);
  assert.deepEqual(stk("PUSH 5\nPUSH 3\nGT"), [1]);
  assert.deepEqual(stk("PUSH 3\nPUSH 3\nEQ"), [1]);
  assert.deepEqual(stk("PUSH 3\nPUSH 4\nNE"), [1]);
});

test("logic not and or", () => {
  assert.deepEqual(stk("PUSH 0\nNOT"), [1]);
  assert.deepEqual(stk("PUSH 5\nNOT"), [0]);
  assert.deepEqual(stk("PUSH 1\nPUSH 0\nAND"), [0]);
  assert.deepEqual(stk("PUSH 2\nPUSH 3\nAND"), [1]);
  assert.deepEqual(stk("PUSH 0\nPUSH 0\nOR"), [0]);
  assert.deepEqual(stk("PUSH 0\nPUSH 4\nOR"), [1]);
});

test("dup swap over", () => {
  assert.deepEqual(stk("PUSH 9\nDUP"), [9, 9]);
  assert.deepEqual(stk("PUSH 1\nPUSH 2\nSWAP"), [2, 1]);
  assert.deepEqual(stk("PUSH 1\nPUSH 2\nOVER"), [1, 2, 1]);
});

test("variables store and load", () => {
  assert.deepEqual(run("PUSH 42\nSTORE x\nLOAD x\nPRINT"), { output: [42], stack: [] });
});

test("opcodes are case-insensitive", () => {
  assert.deepEqual(stk("push 2\npUsH 3\nAdD"), [5]);
});

test("comments and blank lines ignored", () => {
  assert.deepEqual(stk("PUSH 1  # one\n\n   # nothing\nPUSH 2\nADD"), [3]);
});

test("halt stops execution", () => {
  assert.deepEqual(run("PUSH 1\nPRINT\nHALT\nPUSH 999\nPRINT"), { output: [1], stack: [] });
});

test("unconditional jump skips code", () => {
  assert.deepEqual(run("JMP skip\nPUSH 1\nPRINT\nskip:\nPUSH 2\nPRINT"),
    { output: [2], stack: [] });
});

test("jz jumps when zero", () => {
  assert.deepEqual(run("PUSH 0\nJZ z\nPUSH 1\nPRINT\nz:\nPUSH 2\nPRINT"),
    { output: [2], stack: [] });
});

test("jnz jumps when nonzero", () => {
  assert.deepEqual(run("PUSH 5\nJNZ z\nPUSH 1\nPRINT\nz:\nPUSH 2\nPRINT"),
    { output: [2], stack: [] });
});

test("countdown loop", () => {
  const prog = [
    "PUSH 3", "STORE i",
    "loop:", "LOAD i", "DUP", "JZ end", "PRINT",
    "LOAD i", "PUSH 1", "SUB", "STORE i", "JMP loop",
    "end:",
  ].join("\n");
  assert.deepEqual(out(prog), [3, 2, 1]);
});

test("sum 1..n via loop", () => {
  const prog = [
    "PUSH 5", "STORE n", "PUSH 0", "STORE acc",
    "loop:", "LOAD n", "JZ done",
    "LOAD acc", "LOAD n", "ADD", "STORE acc",
    "LOAD n", "PUSH 1", "SUB", "STORE n", "JMP loop",
    "done:", "LOAD acc", "PRINT",
  ].join("\n");
  assert.deepEqual(out(prog), [15]);
});

test("stack underflow throws", () => {
  assert.throws(() => run("ADD"));
  assert.throws(() => run("PUSH 1\nADD"));
  assert.throws(() => run("POP"));
});

test("division by zero throws", () => {
  assert.throws(() => run("PUSH 1\nPUSH 0\nDIV"));
  assert.throws(() => run("PUSH 1\nPUSH 0\nMOD"));
});

test("uninitialized variable throws", () => {
  assert.throws(() => run("LOAD ghost"));
});

test("unknown instruction throws", () => {
  assert.throws(() => run("FOO 1"));
});

test("jump to undefined label throws", () => {
  assert.throws(() => run("JMP nowhere"));
});

test("undefined label throws even if unreachable", () => {
  assert.throws(() => run("HALT\nJMP nowhere"));
});

test("duplicate label throws", () => {
  assert.throws(() => run("a:\nPUSH 1\na:\nPUSH 2"));
});

test("push needs integer operand", () => {
  assert.throws(() => run("PUSH x"));
  assert.throws(() => run("PUSH 1.5"));
});

test("wrong operand count throws", () => {
  assert.throws(() => run("ADD 1"));
  assert.throws(() => run("PUSH"));
  assert.throws(() => run("PUSH 1 2"));
});

test("negative literals", () => {
  assert.deepEqual(stk("PUSH -4\nPUSH -6\nADD"), [-10]);
});
