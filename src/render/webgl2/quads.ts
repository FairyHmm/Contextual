import type { World } from "../../sim/utils/world";
import { link } from "../utils/glsl";
import { surface } from "../utils/surface";
import type { RendererFactory } from "../utils/types";
import { CIRCLE, STYLE, rgb01 } from "../utils/visual";
import fragment from "./quads.frag.glsl";
import vertex from "./quads.vert.glsl";

/** Instanced quads: one static corner buffer, one per-instance center buffer. */
export const quads: RendererFactory = (stage, world) => {
  const { canvas, dpr, width, height } = surface(stage, world);
  const gl = canvas.getContext("webgl2", {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
  });
  if (gl === null) throw new Error("webgl2 context unavailable");

  const program = link(gl, vertex, fragment);
  gl.useProgram(program);

  const size = gl.getUniformLocation(program, "u_size");
  const diameter = gl.getUniformLocation(program, "u_diameter");
  const fill = gl.getUniformLocation(program, "u_fill");
  const bg = gl.getUniformLocation(program, "u_bg");
  const radius = gl.getUniformLocation(program, "u_radius");

  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);

  const corners = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, corners);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([
      -0.5, -0.5, 0.5, -0.5, -0.5, 0.5, -0.5, 0.5, 0.5, -0.5, 0.5, 0.5,
    ]),
    gl.STATIC_DRAW,
  );
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  const data = new Float32Array(world.n * 2);
  const centers = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, centers);
  gl.bufferData(gl.ARRAY_BUFFER, data.byteLength, gl.DYNAMIC_DRAW);
  gl.enableVertexAttribArray(1);
  gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 0, 0);
  gl.vertexAttribDivisor(1, 1);

  gl.uniform2f(size, width, height);
  gl.uniform1f(diameter, CIRCLE.DIAMETER * dpr);
  gl.uniform1f(radius, (CIRCLE.DIAMETER * dpr) / 2);
  gl.uniform3fv(fill, rgb01(STYLE.FILL));
  gl.uniform3fv(bg, rgb01(STYLE.BACKGROUND));
  gl.viewport(0, 0, width, height);
  gl.clearColor(...rgb01(STYLE.BACKGROUND), 1);

  return {
    render(w: World) {
      for (let i = 0; i < w.n; i++) {
        data[i * 2] = w.x[i] * dpr;
        data[i * 2 + 1] = w.y[i] * dpr;
      }
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.bindBuffer(gl.ARRAY_BUFFER, centers);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, data);
      gl.drawArraysInstanced(gl.TRIANGLES, 0, 6, w.n);
    },
  };
};
