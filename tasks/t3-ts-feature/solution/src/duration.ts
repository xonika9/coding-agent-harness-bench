const UNITS: Record<string, number> = {
  ms: 1, s: 1000, m: 60000, h: 3600000, d: 86400000,
};

/** Parse a human duration string into milliseconds. See spec.md. */
export function parseDuration(input: string): number {
  const s = input.trim();
  if (s === "") throw new Error("empty duration");
  const re = /(\d+)(ms|s|m|h|d)/g;
  let total = 0;
  let expected = 0;
  let match: RegExpExecArray | null;
  while ((match = re.exec(s)) !== null) {
    if (match.index !== expected) throw new Error("invalid duration: " + input);
    total += parseInt(match[1], 10) * UNITS[match[2]];
    expected = re.lastIndex;
  }
  if (expected !== s.length) throw new Error("invalid duration: " + input);
  return total;
}
