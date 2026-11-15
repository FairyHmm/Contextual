import type { World } from "../../sim/utils/world";

/** One renderer per variant: builds its scene once, then draws any frame. */
export interface Renderer {
  render(world: World): void;
}

export type RendererFactory = (stage: HTMLElement, world: World) => Renderer;

/** A variant's methods; `default` used without `?method=`. */
export interface VariantDef {
  default: string;
  methods: Record<string, RendererFactory>;
}

/** How a coordinate is turned into the pixel value that gets drawn. */
export type Snap = (v: number) => number;

/** Rounds to a whole pixel. */
export const whole: Snap = v => Math.round(v);
