import { type GlSetup, gl2, glMethod } from "../utils/gl-method";
import { bindAttrib, dynamicBuffer, upload } from "../utils/glsl";
import fragment from "./quads.frag.glsl";
import vertex from "./vertex-id.vert.glsl";

/** No corner buffer: the corners come from gl_VertexID in the shader. */
const vertexIdStep: GlSetup<WebGL2RenderingContext> = (gl, world, p) => {
  const data = new Float32Array(world.n * 2);
  const centers = dynamicBuffer(gl, data.byteLength);
  bindAttrib(gl, centers, p.x, 1);
  bindAttrib(gl, centers, p.y, 1, world.n * 4);
  gl.vertexAttribDivisor(p.x, 1);
  gl.vertexAttribDivisor(p.y, 1);
  return {
    data,
    draw(w) {
      upload(gl, centers, data);
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, w.n);
    },
  };
};

/** Instanced quads with the corner generated from gl_VertexID. */
export const vertexId = glMethod(gl2, vertex, fragment, vertexIdStep);
