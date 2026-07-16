import { test } from "node:test";
import assert from "node:assert/strict";
import { run } from "../src/vm.ts";

const out = (p: string) => run(p).output;
const stk = (p: string) => run(p).stack;

test("jz consumes top even when it does not jump", () => {
  // 5 is nonzero -> no jump, but 5 was popped, so PRINT underflows
  assert.throws(() => run("PUSH 5\nJZ skip\nPRINT\nskip:"));
});

test("jnz consumes top even when it does not jump", () => {
  assert.throws(() => run("PUSH 0\nJNZ skip\nPRINT\nskip:"));
});

test("jz falls through and leaves stack empty", () => {
  assert.deepEqual(run("PUSH 0\nJZ t\nPUSH 111\nt:\nPUSH 9\nPRINT"),
    { output: [9], stack: [] });
});

test("variable names are case-sensitive", () => {
  assert.throws(() => run("PUSH 1\nSTORE x\nLOAD X"));
});

test("store overwrites, last write wins", () => {
  assert.deepEqual(out("PUSH 1\nSTORE v\nPUSH 2\nSTORE v\nLOAD v\nPRINT"), [2]);
});

test("halt returns current non-empty stack", () => {
  assert.deepEqual(run("PUSH 1\nPUSH 2\nHALT\nPUSH 3"), { output: [], stack: [1, 2] });
});

test("labels do not stop execution (fallthrough)", () => {
  assert.deepEqual(out("PUSH 1\nPRINT\nmid:\nPUSH 2\nPRINT"), [1, 2]);
});

test("over underflow on single element", () => {
  assert.throws(() => run("PUSH 1\nOVER"));
});

test("swap underflow on single element", () => {
  assert.throws(() => run("PUSH 1\nSWAP"));
});

test("dup underflow on empty", () => {
  assert.throws(() => run("DUP"));
});

test("comment attached without space", () => {
  assert.deepEqual(stk("PUSH 5#c\nPUSH 6#d\nADD"), [11]);
});

test("rpn expression (2+3)*(10-4)=30", () => {
  assert.deepEqual(stk("PUSH 2\nPUSH 3\nADD\nPUSH 10\nPUSH 4\nSUB\nMUL"), [30]);
});

test("div both negative gives positive quotient", () => {
  assert.deepEqual(stk("PUSH -7\nPUSH -2\nDIV"), [3]);
});

test("mod both negative", () => {
  assert.deepEqual(stk("PUSH -7\nPUSH -3\nMOD"), [-1]);
});

test("and consumes exactly two, leaves rest", () => {
  assert.deepEqual(stk("PUSH 7\nPUSH 2\nPUSH 3\nAND"), [7, 1]);
});

test("or consumes exactly two", () => {
  assert.deepEqual(stk("PUSH 7\nPUSH 0\nPUSH 0\nOR"), [7, 0]);
});

test("le and ge on equal values", () => {
  assert.deepEqual(stk("PUSH 4\nPUSH 4\nLE"), [1]);
  assert.deepEqual(stk("PUSH 4\nPUSH 4\nGE"), [1]);
  assert.deepEqual(stk("PUSH 4\nPUSH 4\nGT"), [0]);
});

test("countdown from zero prints nothing", () => {
  const prog = [
    "PUSH 0", "STORE i",
    "loop:", "LOAD i", "JZ end", "LOAD i", "PRINT",
    "LOAD i", "PUSH 1", "SUB", "STORE i", "JMP loop", "end:",
  ].join("\n");
  assert.deepEqual(out(prog), []);
});

test("multiply by repeated addition", () => {
  const prog = [
    "PUSH 0", "STORE acc", "PUSH 7", "STORE i",
    "loop:", "LOAD i", "JZ done",
    "LOAD acc", "PUSH 6", "ADD", "STORE acc",
    "LOAD i", "PUSH 1", "SUB", "STORE i", "JMP loop",
    "done:", "LOAD acc", "PRINT",
  ].join("\n");
  assert.deepEqual(out(prog), [42]);
});

test("factorial 5 via loop", () => {
  const prog = [
    "PUSH 5", "STORE n", "PUSH 1", "STORE acc",
    "loop:", "LOAD n", "JZ done",
    "LOAD acc", "LOAD n", "MUL", "STORE acc",
    "LOAD n", "PUSH 1", "SUB", "STORE n", "JMP loop",
    "done:", "LOAD acc", "PRINT",
  ].join("\n");
  assert.deepEqual(out(prog), [120]);
});

test("fibonacci 10 via loop", () => {
  const prog = [
    "PUSH 0", "STORE a", "PUSH 1", "STORE b", "PUSH 10", "STORE n",
    "loop:", "LOAD n", "JZ done",
    "LOAD a", "LOAD b", "ADD", "STORE t",
    "LOAD b", "STORE a", "LOAD t", "STORE b",
    "LOAD n", "PUSH 1", "SUB", "STORE n", "JMP loop",
    "done:", "LOAD a", "PRINT",
  ].join("\n");
  assert.deepEqual(out(prog), [55]);
});

test("step limit exceeded throws on tight infinite loop", () => {
  assert.throws(() => run("start:\nJMP start"));
});

test("validation before execution: bad opcode later throws (nothing prints)", () => {
  assert.throws(() => run("PUSH 1\nPRINT\nBOGUS"));
});

test("validation before execution: bad label ref later throws", () => {
  assert.throws(() => run("PUSH 1\nPRINT\nJMP nope"));
});

test("label operand must be a name, not a number", () => {
  assert.throws(() => run("JMP 5"));
});

test("store operand must be a name", () => {
  assert.throws(() => run("PUSH 1\nSTORE 1"));
});

test("load without operand throws", () => {
  assert.throws(() => run("LOAD"));
});

test("push plus-sign literal rejected", () => {
  assert.throws(() => run("PUSH +5"));
});

test("tabs and extra spaces around tokens", () => {
  assert.deepEqual(stk("\tPUSH   2\n   PUSH\t3\nADD  "), [5]);
});

test("print negative values", () => {
  assert.deepEqual(out("PUSH 3\nPUSH 8\nSUB\nPRINT"), [-5]);
});

test("backward and forward jumps combine", () => {
  // sum even-ish: just exercise forward+backward branching to a known result
  const prog = [
    "PUSH 0", "STORE s", "PUSH 4", "STORE i",
    "top:", "LOAD i", "JZ end",
    "LOAD i", "PUSH 2", "MOD", "JNZ skip",
    "LOAD s", "LOAD i", "ADD", "STORE s",
    "skip:", "LOAD i", "PUSH 1", "SUB", "STORE i", "JMP top",
    "end:", "LOAD s", "PRINT",
  ].join("\n");
  // i = 4,3,2,1 -> add even i (4,2) -> 6
  assert.deepEqual(out(prog), [6]);
});

test("not of nonzero is zero, not of zero is one", () => {
  assert.deepEqual(stk("PUSH 9\nNOT\nPUSH 0\nNOT"), [0, 1]);
});

test("empty program with only labels and comments", () => {
  assert.deepEqual(run("# hi\n\nonly:\n   # nothing\n"), { output: [], stack: [] });
});
