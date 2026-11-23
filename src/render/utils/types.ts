import type { World } from "../../sim/utils/world";

/** One renderer per variant: builds its scene once, then draws any frame. */
export interface Renderer {
  /** Resolves once the renderer is usable (async GPU device ready). */
  ready?: Promise<void>;
  /** Draws one frame. May be async (e.g. createImageBitmap on a canvas). */
  render(world: World): void | Promise<void>;
}

export type RendererFactory = (stage: HTMLElement, world: World) => Renderer;

/** A variant's methods; `default` used without `?method=`. */
export interface VariantDef {
  default: string;
  methods: Record<string, RendererFactory>;
}
