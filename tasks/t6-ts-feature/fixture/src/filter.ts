export type Row = Record<string, string | number>;
export type Op = ">=" | "<=" | "!=" | "=" | ">" | "<";
export interface Condition { field: string; op: Op; value: string | number; }

/** Parse the mini filter DSL into conditions. See spec.md. */
export function parseQuery(query: string): Condition[] {
  throw new Error("not implemented");
}

/** Return rows where every condition in the query holds. See spec.md. */
export function applyFilter(rows: Row[], query: string): Row[] {
  throw new Error("not implemented");
}
