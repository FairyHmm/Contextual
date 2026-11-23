import type { Variant } from "../app/params";
import type { World } from "../sim/utils/world";
import { config as bitmap } from "./bitmaprenderer";
import { config as canvas2d } from "./canvas2d";
import { config as html } from "./html";
import { many, single } from "./svg";
import type { Renderer, RendererFactory, VariantDef } from "./utils/types";
import { config as webgl } from "./webgl";
import { config as webgl2 } from "./webgl2";
import { config as webgpu } from "./webgpu";

export const IMPLEMENTATIONS: Partial<Record<Variant, VariantDef>> = {
  "2d": canvas2d,
  webgl,
  webgl2,
  webgpu,
  bitmaprenderer: bitmap,
  html,
  "svg-many": many,
  "svg-path": single,
};

/** The renderer for a variant and method, or an error saying what exists. */
export function resolve(
  variant: Variant,
  method: string | null,
): (stage: HTMLElement, world: World) => Renderer {
  const impl = IMPLEMENTATIONS[variant];
  if (impl === undefined) throw new Error(`${variant}: not implemented yet`);
  const name = method ?? impl.default;
  const create: RendererFactory | undefined = impl.methods[name];
  if (create === undefined) {
    const known = Object.keys(impl.methods).join(", ");
    throw new Error(`${variant}: unknown method "${name}" (try: ${known})`);
  }
  return create;
}
