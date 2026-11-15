import type { Variant } from "../app/params";
import { config as canvas } from "./canvas";
import { config as html } from "./html";
import type { RendererFactory, VariantDef } from "./utils/types";

export const IMPLEMENTATIONS: Partial<Record<Variant, VariantDef>> = {
  canvas,
  html,
};

/** The renderer for a variant and method, or an error saying what exists. */
export function resolve(
  variant: Variant,
  method: string | null,
): RendererFactory {
  const impl = IMPLEMENTATIONS[variant];
  if (impl === undefined) throw new Error(`${variant}: not implemented yet`);
  const name = method ?? impl.default;
  const create = impl.methods[name];
  if (create === undefined) {
    const known = Object.keys(impl.methods).join(", ");
    throw new Error(`${variant}: unknown method "${name}" (try: ${known})`);
  }
  return create;
}
