import { type GlSetup, gl1, glMethod } from "../utils/gl-method";
import { type GL, bindAttrib, dynamicBuffer, upload } from "../utils/glsl";
import { circleSprite } from "../utils/sprite";
import type { RendererFactory } from "../utils/types";
import fragmentTexture from "./points-tex.frag.glsl";
import fragment from "./points.frag.glsl";
import vertex from "./points.vert.glsl";

/** One persistent SoA buffer, both attributes bound once at setup. */
export const pointStep: GlSetup<GL> = (gl, world, p) => {
  const data = new Float32Array(world.n * 2);
  const buffer = dynamicBuffer(gl, data.byteLength);
  bindAttrib(gl, buffer, p.x, 1);
  bindAttrib(gl, buffer, p.y, 1, world.n * 4);
  return {
    data,
    draw(w) {
      upload(gl, buffer, data);
      gl.drawArrays(gl.POINTS, 0, w.n);
    },
  };
};

/** Point sprites with a baked 1:1 alpha sprite instead of analytic AA. */
export const pointTextureStep: GlSetup<GL> = (gl, world, p, dpr) => {
  const data = new Float32Array(world.n * 2);
  const buffer = dynamicBuffer(gl, data.byteLength);
  bindAttrib(gl, buffer, p.x, 1);
  bindAttrib(gl, buffer, p.y, 1, world.n * 4);
  circleSprite(gl, p.program, dpr);
  return {
    data,
    draw(w) {
      upload(gl, buffer, data);
      gl.drawArrays(gl.POINTS, 0, w.n);
    },
  };
};

/** Two buffers, alternating with a rebind each frame to dodge upload stalls. */
const doubleStep: GlSetup<GL> = (gl, world, p) => {
  const data = new Float32Array(world.n * 2);
  const buffers = [
    dynamicBuffer(gl, data.byteLength),
    dynamicBuffer(gl, data.byteLength),
  ];
  const offset = world.n * 4;
  let current = 0;
  return {
    data,
    draw(w) {
      const buffer = buffers[current];
      upload(gl, buffer, data);
      bindAttrib(gl, buffer, p.x, 1);
      bindAttrib(gl, buffer, p.y, 1, offset);
      gl.drawArrays(gl.POINTS, 0, w.n);
      current ^= 1;
    },
  };
};

/** One point sprite per circle: one vertex each, one draw call per frame. */
export const points = glMethod(gl1, vertex, fragment, pointStep);

/** Point sprites, alternating two dynamic buffers to dodge upload stalls. */
export const pointsDouble = glMethod(gl1, vertex, fragment, doubleStep);

/** Point sprites, sampling a baked alpha sprite instead of analytic AA. */
export const pointsTexture = glMethod(
  gl1,
  vertex,
  fragmentTexture,
  pointTextureStep,
);

/** The point-sprite methods, grouped for the variant registry. */
export const pointsMethods = {
  points,
  "points-double": pointsDouble,
  "points-texture": pointsTexture,
} satisfies Record<string, RendererFactory>;
