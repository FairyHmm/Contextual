import type { World } from "../../sim/utils/world";
import { link } from "../utils/glsl";
import { surface } from "../utils/surface";
import type { RendererFactory } from "../utils/types";
import { CIRCLE, STYLE, rgb01 } from "../utils/visual";
import fragment from "./points.frag.glsl";
import vertex from "./points.vert.glsl";

/** One point sprite per circle: one vertex each, one draw call per frame. */
export const points: RendererFactory = (stage, world) => {
  const { canvas, dpr, width, height } = surface(stage, world);
  const gl = canvas.getContext("webgl", {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
  });
  if (gl === null) throw new Error("webgl context unavailable");

  const program = link(gl, vertex, fragment);
  gl.useProgram(program);

  const pos = gl.getAttribLocation(program, "a_pos");
  const size = gl.getUniformLocation(program, "u_size");
  const diameter = gl.getUniformLocation(program, "u_diameter");
  const fill = gl.getUniformLocation(program, "u_fill");
  const bg = gl.getUniformLocation(program, "u_bg");

  const data = new Float32Array(world.n * 2);
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data.byteLength, gl.DYNAMIC_DRAW);
  gl.enableVertexAttribArray(pos);
  gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0);

  gl.uniform2f(size, width, height);
  gl.uniform1f(diameter, CIRCLE.DIAMETER * dpr);
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
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferSubData(gl.ARRAY_BUFFER, 0, data);
      gl.drawArrays(gl.POINTS, 0, w.n);
    },
  };
};
