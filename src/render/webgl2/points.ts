import { gl2, glMethod } from "../utils/gl-method";
import { type RendererFactory } from "../utils/types";
import { pointStep, pointTextureStep } from "../webgl/points";
import fragmentTexture from "../webgl/points-tex.frag.glsl";
import fragment from "../webgl/points.frag.glsl";
import vertex from "../webgl/points.vert.glsl";

/** Point sprites on a WebGL2 context. */
export const points = glMethod(gl2, vertex, fragment, pointStep);

/** Point sprites, sampling a baked alpha sprite instead of analytic AA. */
export const pointsTexture = glMethod(
  gl2,
  vertex,
  fragmentTexture,
  pointTextureStep,
);

/** The point-sprite methods, grouped for the variant registry. */
export const pointsMethods = {
  points,
  "points-texture": pointsTexture,
} satisfies Record<string, RendererFactory>;
