import type { World } from "../../sim/utils/world";
import { type GL, type StyledProgram, glContext, styledProgram } from "./glsl";
import { packPositions } from "./positions";
import { surface } from "./surface";
import type { RendererFactory } from "./types";

/** What a method builds once and runs every frame. */
export interface GlFrame {
  /** The staging array `packPositions` fills each frame. */
  data: Float32Array;
  /** Uploads `data` and issues the draw call. */
  draw: (world: World) => void;
}

/** The per-method setup: everything that differs between methods. */
export type GlSetup<G extends GL> = (
  gl: G,
  world: World,
  program: StyledProgram,
  dpr: number,
) => GlFrame;

/** Fills the staging array each frame; defaults to the SoA packer. */
export type Pack = (out: Float32Array, world: World, dpr: number) => void;

/** Creates a WebGL1 context. */
export const gl1 = (canvas: HTMLCanvasElement): WebGLRenderingContext =>
  glContext(canvas, "webgl");

/** Creates a WebGL2 context. */
export const gl2 = (canvas: HTMLCanvasElement): WebGL2RenderingContext =>
  glContext(canvas, "webgl2");

/**
 * Builds a GL method: the shared surface, context, program, staging array and
 * frame loop (`packPositions` → clear → `draw`). `setup` supplies the buffers
 * or textures and the per-frame draw. Mirrors `canvas2d.method` / `svg.many` —
 * each method is a thin declaration of what makes it different.
 */
export function glMethod<G extends GL>(
  makeGl: (canvas: HTMLCanvasElement) => G,
  vs: string,
  fs: string,
  setup: GlSetup<G>,
  pack: Pack = packPositions,
): RendererFactory {
  return (stage, world) => {
    const { canvas, dpr, width, height } = surface(stage, world);
    const gl = makeGl(canvas);
    const program = styledProgram(gl, vs, fs, dpr, width, height);
    const { data, draw } = setup(gl, world, program, dpr);
    return {
      render(w) {
        pack(data, w, dpr);
        gl.clear(gl.COLOR_BUFFER_BIT);
        draw(w);
      },
    };
  };
}
