import { type GlSetup, gl1, glMethod } from "../utils/gl-method";
import {
  QUAD_CORNERS,
  bindAttrib,
  dynamicBuffer,
  staticBuffer,
  upload,
} from "../utils/glsl";
import { circleSprite } from "../utils/sprite";
import fragmentTexture from "./instanced-tex.frag.glsl";
import fragment from "./instanced.frag.glsl";
import vertex from "./instanced.vert.glsl";

/** Instanced quads through ANGLE_instanced_arrays: one draw call. */
const instancedStep: GlSetup<WebGLRenderingContext> = (gl, world, p) => {
  const ext = gl.getExtension("ANGLE_instanced_arrays");
  if (ext === null) throw new Error("ANGLE_instanced_arrays unavailable");

  const data = new Float32Array(world.n * 2);
  staticBuffer(gl, QUAD_CORNERS, p.corner);
  ext.vertexAttribDivisorANGLE(p.corner, 0);
  const centers = dynamicBuffer(gl, data.byteLength);
  bindAttrib(gl, centers, p.x, 1);
  bindAttrib(gl, centers, p.y, 1, world.n * 4);
  ext.vertexAttribDivisorANGLE(p.x, 1);
  ext.vertexAttribDivisorANGLE(p.y, 1);

  return {
    data,
    draw(w) {
      upload(gl, centers, data);
      ext.drawArraysInstancedANGLE(gl.TRIANGLE_STRIP, 0, 4, w.n);
    },
  };
};

/** Instanced quads sampling a baked sprite instead of analytic AA. */
const instancedTextureStep: GlSetup<WebGLRenderingContext> = (
  gl,
  world,
  p,
  dpr,
) => {
  const ext = gl.getExtension("ANGLE_instanced_arrays");
  if (ext === null) throw new Error("ANGLE_instanced_arrays unavailable");

  const data = new Float32Array(world.n * 2);
  staticBuffer(gl, QUAD_CORNERS, p.corner);
  ext.vertexAttribDivisorANGLE(p.corner, 0);
  const centers = dynamicBuffer(gl, data.byteLength);
  bindAttrib(gl, centers, p.x, 1);
  bindAttrib(gl, centers, p.y, 1, world.n * 4);
  ext.vertexAttribDivisorANGLE(p.x, 1);
  ext.vertexAttribDivisorANGLE(p.y, 1);
  circleSprite(gl, p.program, dpr);

  return {
    data,
    draw(w) {
      upload(gl, centers, data);
      ext.drawArraysInstancedANGLE(gl.TRIANGLE_STRIP, 0, 4, w.n);
    },
  };
};

export const instanced = glMethod(gl1, vertex, fragment, instancedStep);

export const instancedTexture = glMethod(
  gl1,
  vertex,
  fragmentTexture,
  instancedTextureStep,
);
