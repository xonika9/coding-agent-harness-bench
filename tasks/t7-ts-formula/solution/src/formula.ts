// Reference solution for t7-ts-formula. Not shown to agents.
// Implements evalFormula per spec.md.

type ErrCode = "#DIV/0!" | "#VALUE!" | "#NAME?";
class Err {
  code: ErrCode;
  constructor(code: ErrCode) { this.code = code; }
}
type Val = number | string | Err;
const isErr = (v: Val): v is Err => v instanceof Err;

const KNOWN = new Set(["SUM", "AVG", "MIN", "MAX", "ABS", "ROUND", "IF", "AND", "OR", "NOT", "COUNT"]);
const AGG = new Set(["SUM", "AVG", "MIN", "MAX", "COUNT"]);
const CMP = new Set(["=", "<>", "<", "<=", ">", ">="]);

// ---------- tokenizer ----------
type Tok =
  | { t: "num"; v: number }
  | { t: "str"; v: string }
  | { t: "name"; v: string }
  | { t: "op"; v: string }
  | { t: "lp" }
  | { t: "rp" }
  | { t: "comma" }
  | { t: "colon" };

function tokenize(src: string): Tok[] {
  const toks: Tok[] = [];
  let i = 0;
  const n = src.length;
  while (i < n) {
    const c = src[i];
    if (c === " " || c === "\t" || c === "\n" || c === "\r") { i++; continue; }
    if (c >= "0" && c <= "9") {
      let j = i + 1;
      while (j < n && src[j] >= "0" && src[j] <= "9") j++;
      if (j < n && src[j] === ".") {
        j++;
        if (!(j < n && src[j] >= "0" && src[j] <= "9")) throw new Error("bad number");
        while (j < n && src[j] >= "0" && src[j] <= "9") j++;
      }
      toks.push({ t: "num", v: Number(src.slice(i, j)) });
      i = j;
      continue;
    }
    if (c === '"') {
      let j = i + 1;
      while (j < n && src[j] !== '"') j++;
      if (j >= n) throw new Error("unterminated string");
      toks.push({ t: "str", v: src.slice(i + 1, j) });
      i = j + 1;
      continue;
    }
    if ((c >= "A" && c <= "Z") || (c >= "a" && c <= "z")) {
      let j = i + 1;
      while (j < n && ((src[j] >= "A" && src[j] <= "Z") || (src[j] >= "a" && src[j] <= "z") || (src[j] >= "0" && src[j] <= "9"))) j++;
      toks.push({ t: "name", v: src.slice(i, j) });
      i = j;
      continue;
    }
    if (c === "<") {
      if (src[i + 1] === "=") { toks.push({ t: "op", v: "<=" }); i += 2; }
      else if (src[i + 1] === ">") { toks.push({ t: "op", v: "<>" }); i += 2; }
      else { toks.push({ t: "op", v: "<" }); i++; }
      continue;
    }
    if (c === ">") {
      if (src[i + 1] === "=") { toks.push({ t: "op", v: ">=" }); i += 2; }
      else { toks.push({ t: "op", v: ">" }); i++; }
      continue;
    }
    if (c === "=") { toks.push({ t: "op", v: "=" }); i++; continue; }
    if (c === "+" || c === "-" || c === "*" || c === "/" || c === "^") { toks.push({ t: "op", v: c }); i++; continue; }
    if (c === "(") { toks.push({ t: "lp" }); i++; continue; }
    if (c === ")") { toks.push({ t: "rp" }); i++; continue; }
    if (c === ",") { toks.push({ t: "comma" }); i++; continue; }
    if (c === ":") { toks.push({ t: "colon" }); i++; continue; }
    throw new Error("unexpected char: " + c);
  }
  return toks;
}

// ---------- AST ----------
type Node =
  | { k: "num"; v: number }
  | { k: "str"; v: string }
  | { k: "ref"; v: string }
  | { k: "range"; a: string; b: string }
  | { k: "call"; name: string; args: Node[] }
  | { k: "neg"; x: Node }
  | { k: "bin"; op: string; l: Node; r: Node };

const REF_RE = /^[A-Z]+[0-9]+$/;

class Parser {
  pos = 0;
  toks: Tok[];
  constructor(toks: Tok[]) { this.toks = toks; }
  peek(): Tok | undefined { return this.toks[this.pos]; }
  next(): Tok { const t = this.toks[this.pos]; if (!t) throw new Error("unexpected end"); this.pos++; return t; }
  eof(): boolean { return this.pos >= this.toks.length; }

  parse(): Node {
    const e = this.parseCompare();
    if (!this.eof()) throw new Error("trailing tokens");
    return e;
  }
  parseCompare(): Node {
    let l = this.parseAdd();
    while (!this.eof()) {
      const t = this.peek()!;
      if (t.t === "op" && CMP.has(t.v)) { this.next(); l = { k: "bin", op: t.v, l, r: this.parseAdd() }; }
      else break;
    }
    return l;
  }
  parseAdd(): Node {
    let l = this.parseMul();
    while (!this.eof()) {
      const t = this.peek()!;
      if (t.t === "op" && (t.v === "+" || t.v === "-")) { this.next(); l = { k: "bin", op: t.v, l, r: this.parseMul() }; }
      else break;
    }
    return l;
  }
  parseMul(): Node {
    let l = this.parseUnary();
    while (!this.eof()) {
      const t = this.peek()!;
      if (t.t === "op" && (t.v === "*" || t.v === "/")) { this.next(); l = { k: "bin", op: t.v, l, r: this.parseUnary() }; }
      else break;
    }
    return l;
  }
  parseUnary(): Node {
    const t = this.peek();
    if (t && t.t === "op" && t.v === "-") { this.next(); return { k: "neg", x: this.parseUnary() }; }
    return this.parsePow();
  }
  parsePow(): Node {
    const l = this.parseAtom();
    const t = this.peek();
    if (t && t.t === "op" && t.v === "^") { this.next(); return { k: "bin", op: "^", l, r: this.parseUnary() }; }
    return l;
  }
  parseAtom(): Node {
    const t = this.next();
    if (t.t === "num") return { k: "num", v: t.v };
    if (t.t === "str") return { k: "str", v: t.v };
    if (t.t === "lp") {
      const e = this.parseCompare();
      const r = this.next();
      if (r.t !== "rp") throw new Error("expected )");
      return e;
    }
    if (t.t === "name") {
      const nx = this.peek();
      if (nx && nx.t === "lp") {
        this.next(); // consume (
        const args: Node[] = [];
        if (this.peek() && this.peek()!.t === "rp") { this.next(); return { k: "call", name: t.v, args }; }
        args.push(this.parseArg());
        while (this.peek() && this.peek()!.t === "comma") { this.next(); args.push(this.parseArg()); }
        const r = this.next();
        if (r.t !== "rp") throw new Error("expected ) in call");
        return { k: "call", name: t.v, args };
      }
      if (REF_RE.test(t.v)) return { k: "ref", v: t.v };
      throw new Error("bad name: " + t.v);
    }
    throw new Error("unexpected token");
  }
  parseArg(): Node {
    const t = this.peek();
    const t2 = this.toks[this.pos + 1];
    if (t && t.t === "name" && REF_RE.test(t.v) && t2 && t2.t === "colon") {
      this.next(); // ref a
      this.next(); // colon
      const b = this.next();
      if (b.t !== "name" || !REF_RE.test(b.v)) throw new Error("bad range end");
      return { k: "range", a: t.v, b: b.v };
    }
    return this.parseCompare();
  }
}

// ---------- ranges ----------
function splitRef(ref: string): { col: string; row: number } {
  const m = /^([A-Z]+)([0-9]+)$/.exec(ref)!;
  return { col: m[1], row: Number(m[2]) };
}
function colNum(col: string): number {
  let n = 0;
  for (const ch of col) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n;
}
function numCol(n: number): string {
  let s = "";
  while (n > 0) { const r = (n - 1) % 26; s = String.fromCharCode(65 + r) + s; n = Math.floor((n - 1) / 26); }
  return s;
}
function expandRange(a: string, b: string): string[] {
  const pa = splitRef(a), pb = splitRef(b);
  if (pa.col === pb.col) {
    const lo = Math.min(pa.row, pb.row), hi = Math.max(pa.row, pb.row);
    const out: string[] = [];
    for (let r = lo; r <= hi; r++) out.push(pa.col + r);
    return out;
  }
  if (pa.row === pb.row) {
    const lo = Math.min(colNum(pa.col), colNum(pb.col)), hi = Math.max(colNum(pa.col), colNum(pb.col));
    const out: string[] = [];
    for (let c = lo; c <= hi; c++) out.push(numCol(c) + pa.row);
    return out;
  }
  throw new Error("invalid range: " + a + ":" + b);
}

// ---------- evaluator ----------
function evalNode(node: Node, cells: Record<string, number | string>): Val {
  switch (node.k) {
    case "num": return node.v;
    case "str": return node.v;
    case "ref": {
      const v = cells[node.v];
      return v === undefined ? 0 : v;
    }
    case "range":
      throw new Error("range outside aggregate function");
    case "neg": {
      const x = evalNode(node.x, cells);
      if (isErr(x)) return x;
      if (typeof x === "string") return new Err("#VALUE!");
      return -x;
    }
    case "bin": {
      const l = evalNode(node.l, cells);
      if (isErr(l)) return l;
      const r = evalNode(node.r, cells);
      if (isErr(r)) return r;
      const op = node.op;
      if (op === "=" || op === "<>") {
        let eq: boolean;
        if (typeof l === "number" && typeof r === "number") eq = l === r;
        else if (typeof l === "string" && typeof r === "string") eq = l === r;
        else eq = false;
        return (op === "=" ? eq : !eq) ? 1 : 0;
      }
      if (typeof l === "string" || typeof r === "string") return new Err("#VALUE!");
      switch (op) {
        case "+": return l + r;
        case "-": return l - r;
        case "*": return l * r;
        case "/": { if (r === 0) return new Err("#DIV/0!"); const q = l / r; return Number.isFinite(q) ? q : new Err("#DIV/0!"); }
        case "^": { const p = Math.pow(l, r); return Number.isFinite(p) ? p : new Err("#DIV/0!"); }
        case "<": return l < r ? 1 : 0;
        case "<=": return l <= r ? 1 : 0;
        case ">": return l > r ? 1 : 0;
        case ">=": return l >= r ? 1 : 0;
      }
      throw new Error("bad op");
    }
    case "call":
      return evalCall(node, cells);
  }
}

function argValues(args: Node[], cells: Record<string, number | string>): Val[] {
  const out: Val[] = [];
  for (const a of args) {
    if (a.k === "range") {
      for (const ref of expandRange(a.a, a.b)) {
        const v = cells[ref];
        out.push(v === undefined ? 0 : v);
      }
    } else {
      out.push(evalNode(a, cells));
    }
  }
  return out;
}

function evalCall(node: Extract<Node, { k: "call" }>, cells: Record<string, number | string>): Val {
  const { name, args } = node;
  if (!KNOWN.has(name)) return new Err("#NAME?");

  if (!AGG.has(name)) {
    for (const a of args) if (a.k === "range") throw new Error("range not allowed in " + name);
  }

  if (name === "IF") {
    if (args.length !== 3) throw new Error("IF arity");
    const cond = evalNode(args[0], cells);
    if (isErr(cond)) return cond;
    if (typeof cond === "string") return new Err("#VALUE!");
    return cond !== 0 ? evalNode(args[1], cells) : evalNode(args[2], cells);
  }
  if (name === "NOT") {
    if (args.length !== 1) throw new Error("NOT arity");
    const x = evalNode(args[0], cells);
    if (isErr(x)) return x;
    if (typeof x === "string") return new Err("#VALUE!");
    return x === 0 ? 1 : 0;
  }
  if (name === "AND" || name === "OR") {
    if (args.length < 1) throw new Error(name + " arity");
    let acc = name === "AND" ? 1 : 0;
    for (const a of args) {
      const v = evalNode(a, cells);
      if (isErr(v)) return v;
      if (typeof v === "string") return new Err("#VALUE!");
      if (name === "AND") { if (v === 0) acc = 0; } else { if (v !== 0) acc = 1; }
    }
    return acc;
  }
  if (name === "ABS") {
    if (args.length !== 1) throw new Error("ABS arity");
    const x = evalNode(args[0], cells);
    if (isErr(x)) return x;
    if (typeof x === "string") return new Err("#VALUE!");
    return Math.abs(x);
  }
  if (name === "ROUND") {
    if (args.length !== 2) throw new Error("ROUND arity");
    const x = evalNode(args[0], cells);
    if (isErr(x)) return x;
    const nn = evalNode(args[1], cells);
    if (isErr(nn)) return nn;
    if (typeof x === "string" || typeof nn === "string") return new Err("#VALUE!");
    if (!Number.isInteger(nn)) return new Err("#VALUE!");
    const f = Math.pow(10, nn);
    const scaled = x * f;
    const rounded = Math.sign(scaled) * Math.round(Math.abs(scaled));
    return rounded / f;
  }

  // aggregates: SUM / AVG / MIN / MAX / COUNT
  if (args.length < 1) throw new Error(name + " arity");
  const vals = argValues(args, cells);
  if (name === "COUNT") {
    let cnt = 0;
    for (const v of vals) { if (isErr(v)) return v; if (typeof v === "number") cnt++; }
    return cnt;
  }
  const nums: number[] = [];
  for (const v of vals) {
    if (isErr(v)) return v;
    if (typeof v === "string") return new Err("#VALUE!");
    nums.push(v);
  }
  switch (name) {
    case "SUM": return nums.reduce((a, b) => a + b, 0);
    case "AVG": {
      if (nums.length === 0) return new Err("#DIV/0!");
      return nums.reduce((a, b) => a + b, 0) / nums.length;
    }
    case "MIN": return Math.min(...nums);
    case "MAX": return Math.max(...nums);
  }
  throw new Error("unreachable");
}

export function evalFormula(formula: string, cells: Record<string, number | string>): number | string {
  if (typeof formula !== "string" || formula.trim() === "") throw new Error("empty formula");
  const s = formula.trim();
  if (s[0] !== "=") throw new Error("formula must start with =");
  const body = s.slice(1);
  if (body.trim() === "") throw new Error("empty formula body");
  const toks = tokenize(body);
  const ast = new Parser(toks).parse();
  const res = evalNode(ast, cells);
  if (isErr(res)) return res.code;
  return res;
}
