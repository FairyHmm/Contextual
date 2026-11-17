// The `--method` filter: one flag, three token shapes.
//
//   html            every method of that variant
//   html/translate  one variant's one method
//   translate       that name in every variant that has it

import { type Entry, list } from "./lib.ts";

type MethodRef =
  | { kind: "variant"; variant: string }
  | { kind: "pinned"; variant: string; name: string }
  | { kind: "name"; name: string };

/**
 * Classifies a token: `a/b` is pinned, a known method is a name, else a
 * variant.
 */
const parse = (token: string, names: Set<string>): MethodRef => {
  const slash = token.indexOf("/");
  if (slash >= 0) {
    return {
      kind: "pinned",
      variant: token.slice(0, slash),
      name: token.slice(slash + 1),
    };
  }
  return names.has(token)
    ? { kind: "name", name: token }
    : { kind: "variant", variant: token };
};

/** Formats a reference back as it was written, for error messages. */
const text = (ref: MethodRef): string => {
  if (ref.kind === "variant") return ref.variant;
  if (ref.kind === "pinned") return `${ref.variant}/${ref.name}`;
  return ref.name;
};

/** Does this entry match one token? */
const matches = (entry: Entry, ref: MethodRef): boolean => {
  if (ref.kind === "variant") return ref.variant === entry.variant;
  if (ref.kind === "pinned") {
    return ref.variant === entry.variant && ref.name === entry.method;
  }
  return ref.name === entry.method;
};

export interface Selection {
  entries: Entry[];
  /** Bare method names that spanned more than one variant, e.g. `translate`. */
  shared: string[];
}

/** Narrows entries by the --method flag; unknown tokens fail. */
export function select(
  entries: Entry[],
  flags: { method?: string | undefined },
): Selection {
  const names = new Set(entries.map(e => e.method));
  const refs = list(flags.method).map(token => parse(token, names));

  const unknown = refs
    .filter(ref => !entries.some(e => matches(e, ref)))
    .map(ref => `method ${text(ref)}`);
  if (unknown.length > 0) {
    const have = entries.map(e => e.name).join(", ");
    throw new Error(`unknown ${unknown.join(", ")}. Available: ${have}`);
  }

  const picked = entries.filter(
    e => refs.length === 0 || refs.some(ref => matches(e, ref)),
  );

  // Only a bare method name can span variants.
  const shared = refs
    .filter((ref): ref is { kind: "name"; name: string } => ref.kind === "name")
    .flatMap(ref => {
      const hit = picked.filter(e => e.method === ref.name);
      const variants = new Set(hit.map(e => e.variant));
      return variants.size < 2 ? [] : [ref.name];
    });

  return { entries: picked, shared };
}
