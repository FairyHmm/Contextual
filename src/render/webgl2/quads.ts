import { type GlSetup, gl2, glMethod } from "../utils/gl-method";
import {
  QUAD_CORNERS,
  bindAttrib,
  dynamicBuffer,
  staticBuffer,
  upload,
} from "../utils/glsl";
import { circleSprite } from "../utils/sprite";
import type { RendererFactory } from "../utils/types";
import fragmentTexture from "./quads-tex.frag.glsl";
import fragment from "./quads.frag.glsl";
import vertex from "./quads.vert.glsl";

/** One static corner buffer, one center buffer, one VAO. */
const singleStep: GlSetup<WebGL2RenderingContext> = (gl, world, p) => {
  const data = new Float32Array(world.n * 2);
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  staticBuffer(gl, QUAD_CORNERS, p.corner);
  const centers = dynamicBuffer(gl, data.byteLength);
  bindAttrib(gl, centers, p.x, 1);
  bindAttrib(gl, centers, p.y, 1, world.n * 4);
  gl.vertexAttribDivisor(p.x, 1);
  gl.vertexAttribDivisor(p.y, 1);
  gl.bindVertexArray(null);
  return {
    data,
    draw(w) {
      upload(gl, centers, data);
      gl.bindVertexArray(vao);
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, w.n);
    },
  };
};

/** Two center buffers and two VAOs, alternating to dodge upload stalls. */
const doubleStep: GlSetup<WebGL2RenderingContext> = (gl, world, p) => {
  const data = new Float32Array(world.n * 2);
  const buffers = [
    dynamicBuffer(gl, data.byteLength),
    dynamicBuffer(gl, data.byteLength),
  ];
  const corners = staticBuffer(gl, QUAD_CORNERS, p.corner);
  const offset = world.n * 4;
  const vaos = buffers.map(buffer => {
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    bindAttrib(gl, corners, p.corner);
    bindAttrib(gl, buffer, p.x, 1);
    bindAttrib(gl, buffer, p.y, 1, offset);
    gl.vertexAttribDivisor(p.x, 1);
    gl.vertexAttribDivisor(p.y, 1);
    return vao;
  });
  gl.bindVertexArray(null);
  let current = 0;
  return {
    data,
    draw(w) {
      const index = current;
      upload(gl, buffers[index], data);
      gl.bindVertexArray(vaos[index]);
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, w.n);
      current ^= 1;
    },
  };
};

/** One center buffer, orphaned with bufferData each frame. */
const orphanStep: GlSetup<WebGL2RenderingContext> = (gl, world, p) => {
  const data = new Float32Array(world.n * 2);
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  staticBuffer(gl, QUAD_CORNERS, p.corner);
  const centers = dynamicBuffer(gl, data.byteLength);
  bindAttrib(gl, centers, p.x, 1);
  bindAttrib(gl, centers, p.y, 1, world.n * 4);
  gl.vertexAttribDivisor(p.x, 1);
  gl.vertexAttribDivisor(p.y, 1);
  gl.bindVertexArray(null);
  return {
    data,
    draw(w) {
      gl.bindBuffer(gl.ARRAY_BUFFER, centers);
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
      gl.bindVertexArray(vao);
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, w.n);
    },
  };
};

/** Instanced quads sampling a baked sprite instead of analytic AA. */
const quadTextureStep: GlSetup<WebGL2RenderingContext> = (
  gl,
  world,
  p,
  dpr,
) => {
  const data = new Float32Array(world.n * 2);
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  staticBuffer(gl, QUAD_CORNERS, p.corner);
  const centers = dynamicBuffer(gl, data.byteLength);
  bindAttrib(gl, centers, p.x, 1);
  bindAttrib(gl, centers, p.y, 1, world.n * 4);
  gl.vertexAttribDivisor(p.x, 1);
  gl.vertexAttribDivisor(p.y, 1);
  gl.bindVertexArray(null);
  circleSprite(gl, p.program, dpr);
  return {
    data,
    draw(w) {
      upload(gl, centers, data);
      gl.bindVertexArray(vao);
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, w.n);
    },
  };
};

/** Instanced quads: one static corner buffer, one per-instance center buffer. */
export const quads = glMethod(gl2, vertex, fragment, singleStep);

/** Instanced quads, alternating two center buffers (and two VAOs). */
export const quadsDouble = glMethod(gl2, vertex, fragment, doubleStep);

/** Instanced quads, orphaning the center buffer with bufferData each frame. */
export const quadsOrphan = glMethod(gl2, vertex, fragment, orphanStep);

/** Instanced quads, sampling a baked alpha sprite instead of analytic AA. */
export const quadsTexture = glMethod(
  gl2,
  vertex,
  fragmentTexture,
  quadTextureStep,
);

/** The instanced-quad methods, grouped for the variant registry. */
export const quadsMethods = {
  quads,
  "quads-double": quadsDouble,
  "quads-orphan": quadsOrphan,
  "quads-texture": quadsTexture,
} satisfies Record<string, RendererFactory>;
