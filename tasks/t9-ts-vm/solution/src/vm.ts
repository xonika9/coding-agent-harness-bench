export interface VMResult { output: number[]; stack: number[]; }

type Instr = { op: string; arg?: string; line: number };

const NAME = /^[A-Za-z_][A-Za-z0-9_]*$/;
const INT = /^-?\d+$/;

// operand shape per opcode: "none" | "int" | "name" | "label"
const OPERANDS: Record<string, "none" | "int" | "name" | "label"> = {
  PUSH: "int",
  POP: "none", DUP: "none", SWAP: "none", OVER: "none",
  ADD: "none", SUB: "none", MUL: "none", DIV: "none", MOD: "none", NEG: "none",
  EQ: "none", NE: "none", LT: "none", LE: "none", GT: "none", GE: "none",
  NOT: "none", AND: "none", OR: "none",
  LOAD: "name", STORE: "name",
  PRINT: "none",
  JMP: "label", JZ: "label", JNZ: "label",
  HALT: "none",
};

const STEP_LIMIT = 100000;

function fail(msg: string): never { throw new Error("VM error: " + msg); }

function parse(program: string): { code: Instr[]; labels: Map<string, number> } {
  const code: Instr[] = [];
  const labels = new Map<string, number>();
  const lines = program.split("\n");
  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    const hash = line.indexOf("#");
    if (hash >= 0) line = line.slice(0, hash);
    line = line.trim();
    if (line === "") continue;

    // label definition: "name:"
    if (line.endsWith(":")) {
      const name = line.slice(0, -1).trim();
      if (!NAME.test(name)) fail(`bad label definition on line ${i + 1}`);
      if (labels.has(name)) fail(`duplicate label "${name}"`);
      labels.set(name, code.length);
      continue;
    }

    const toks = line.split(/\s+/);
    const op = toks[0].toUpperCase();
    const shape = OPERANDS[op];
    if (shape === undefined) fail(`unknown instruction "${toks[0]}" on line ${i + 1}`);

    if (shape === "none") {
      if (toks.length !== 1) fail(`"${op}" takes no operand (line ${i + 1})`);
      code.push({ op, line: i + 1 });
    } else {
      if (toks.length !== 2) fail(`"${op}" needs exactly one operand (line ${i + 1})`);
      const arg = toks[1];
      if (shape === "int" && !INT.test(arg)) fail(`"${op}" needs an integer operand (line ${i + 1})`);
      if ((shape === "name" || shape === "label") && !NAME.test(arg)) fail(`"${op}" needs a name operand (line ${i + 1})`);
      code.push({ op, arg, line: i + 1 });
    }
  }
  // validate label references
  for (const ins of code) {
    if (OPERANDS[ins.op] === "label" && !labels.has(ins.arg as string)) {
      fail(`jump to undefined label "${ins.arg}" (line ${ins.line})`);
    }
  }
  return { code, labels };
}

function trunc(x: number): number { return Math.trunc(x); }
// Normalize -0 to 0: node's strict deepEqual distinguishes them, and integer
// arithmetic should never surface a signed zero.
function n0(x: number): number { return x === 0 ? 0 : x; }

export function run(program: string): VMResult {
  const { code, labels } = parse(program);
  const stack: number[] = [];
  const vars = new Map<string, number>();
  const output: number[] = [];

  const pop = (): number => {
    if (stack.length === 0) fail("stack underflow");
    return stack.pop() as number;
  };

  let pc = 0;
  let steps = 0;
  while (pc < code.length) {
    if (++steps > STEP_LIMIT) fail("step limit exceeded");
    const ins = code[pc];
    let nextPc = pc + 1;
    switch (ins.op) {
      case "PUSH": stack.push(n0(parseInt(ins.arg as string, 10))); break;
      case "POP": pop(); break;
      case "DUP": { const a = pop(); stack.push(a, a); break; }
      case "SWAP": { const b = pop(); const a = pop(); stack.push(b, a); break; }
      case "OVER": { const b = pop(); const a = pop(); stack.push(a, b, a); break; }
      case "ADD": { const b = pop(); const a = pop(); stack.push(n0(a + b)); break; }
      case "SUB": { const b = pop(); const a = pop(); stack.push(n0(a - b)); break; }
      case "MUL": { const b = pop(); const a = pop(); stack.push(n0(a * b)); break; }
      case "DIV": { const b = pop(); const a = pop(); if (b === 0) fail("division by zero"); stack.push(n0(trunc(a / b))); break; }
      case "MOD": { const b = pop(); const a = pop(); if (b === 0) fail("modulo by zero"); stack.push(n0(a - trunc(a / b) * b)); break; }
      case "NEG": { const a = pop(); stack.push(n0(-a)); break; }
      case "EQ": { const b = pop(); const a = pop(); stack.push(a === b ? 1 : 0); break; }
      case "NE": { const b = pop(); const a = pop(); stack.push(a !== b ? 1 : 0); break; }
      case "LT": { const b = pop(); const a = pop(); stack.push(a < b ? 1 : 0); break; }
      case "LE": { const b = pop(); const a = pop(); stack.push(a <= b ? 1 : 0); break; }
      case "GT": { const b = pop(); const a = pop(); stack.push(a > b ? 1 : 0); break; }
      case "GE": { const b = pop(); const a = pop(); stack.push(a >= b ? 1 : 0); break; }
      case "NOT": { const a = pop(); stack.push(a === 0 ? 1 : 0); break; }
      case "AND": { const b = pop(); const a = pop(); stack.push(a !== 0 && b !== 0 ? 1 : 0); break; }
      case "OR": { const b = pop(); const a = pop(); stack.push(a !== 0 || b !== 0 ? 1 : 0); break; }
      case "LOAD": {
        const name = ins.arg as string;
        if (!vars.has(name)) fail(`uninitialized variable "${name}"`);
        stack.push(vars.get(name) as number);
        break;
      }
      case "STORE": { const a = pop(); vars.set(ins.arg as string, a); break; }
      case "PRINT": { output.push(pop()); break; }
      case "JMP": nextPc = labels.get(ins.arg as string) as number; break;
      case "JZ": { const a = pop(); if (a === 0) nextPc = labels.get(ins.arg as string) as number; break; }
      case "JNZ": { const a = pop(); if (a !== 0) nextPc = labels.get(ins.arg as string) as number; break; }
      case "HALT": return { output, stack };
      default: fail(`unhandled opcode "${ins.op}"`);
    }
    pc = nextPc;
  }
  return { output, stack };
}
