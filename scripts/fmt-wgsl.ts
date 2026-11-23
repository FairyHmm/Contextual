// Formats (or checks) every .wgsl file with @wasm-fmt/wgslfmt.
//   node scripts/fmt-wgsl.ts           # rewrite in place
//   node scripts/fmt-wgsl.ts --check   # report unformatted files, exit 1
import { glob, readFile, writeFile } from "node:fs/promises";

import { format } from "@wasm-fmt/wgslfmt";

const check = process.argv.includes("--check");
const files: string[] = [];
for await (const entry of glob("src/**/*.wgsl")) files.push(entry);

// Two-space indent to match the rest of the repo; keep trailing commas.
const config = { indent_symbol: "  ", trailing_commas: "insert" as const };

let dirty = 0;
for (const file of files.sort()) {
  const before = await readFile(file, "utf8");
  const after = format(before, config);
  if (before === after) continue;
  dirty++;
  if (check) {
    console.error(`format: ${file}`);
  } else {
    await writeFile(file, after);
  }
}

if (check && dirty > 0) {
  console.error(`\n${dirty} file(s) need formatting. Run without --check.`);
  process.exit(1);
}
