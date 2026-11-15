/** A markdown table: first column left-aligned, the rest right-aligned. */
export function table(header: string[], rows: string[][]): string {
  const widths = header.map((h, c) =>
    Math.max(h.length, ...rows.map(r => r[c].length)),
  );
  const line = (cells: string[]) =>
    `| ${cells.map((cell, c) => (c === 0 ? cell.padEnd(widths[c]) : cell.padStart(widths[c]))).join(" | ")} |`;
  const rule = widths.map((w, c) =>
    c === 0 ? "-".repeat(w) : `${"-".repeat(w - 1)}:`,
  );
  return [line(header), `| ${rule.join(" | ")} |`, ...rows.map(line)].join(
    "\n",
  );
}
