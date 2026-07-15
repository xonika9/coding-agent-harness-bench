export type Row = Record<string, string | number>;
export type Op = ">=" | "<=" | "!=" | "=" | ">" | "<";
export interface Condition { field: string; op: Op; value: string | number; }

const COND_RE = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*(>=|<=|!=|=|>|<)\s*(.+?)\s*$/;

export function parseQuery(query: string): Condition[] {
  const q = query.trim();
  if (q === "") throw new Error("empty query");
  const conds: Condition[] = [];
  for (const part of q.split(" AND ")) {
    const m = COND_RE.exec(part);
    if (!m) throw new Error("invalid condition: " + part);
    const raw = m[3];
    const value: string | number = /^-?\d+(\.\d+)?$/.test(raw) ? Number(raw) : raw;
    conds.push({ field: m[1], op: m[2] as Op, value });
  }
  return conds;
}

function holds(row: Row, c: Condition): boolean {
  if (!(c.field in row)) return false;
  const rv = row[c.field];
  if (c.op === "=") return String(rv) === String(c.value);
  if (c.op === "!=") return String(rv) !== String(c.value);
  const rn = Number(rv), cn = Number(c.value);
  if (Number.isNaN(rn) || Number.isNaN(cn)) return false;
  switch (c.op) {
    case ">": return rn > cn;
    case ">=": return rn >= cn;
    case "<": return rn < cn;
    case "<=": return rn <= cn;
  }
  return false;
}

export function applyFilter(rows: Row[], query: string): Row[] {
  const conds = parseQuery(query);
  return rows.filter((row) => conds.every((c) => holds(row, c)));
}
