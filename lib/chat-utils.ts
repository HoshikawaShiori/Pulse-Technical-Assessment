/**
 * Build a stable pairId from two session IDs.
 * Sorted lexicographically so both peers produce the same key.
 */
export function makePairId(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}