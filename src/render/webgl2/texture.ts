import { type GlSetup, gl2, glMethod } from "../utils/gl-method";
import { packPositionsInterleaved } from "../utils/positions";
import fragment from "./quads.frag.glsl";
import vertex from "./texture.vert.glsl";

const TEX_WIDTH = 1024;

/** Positions in an RG32F texture, read with texelFetch in the vertex shader. */
const textureStep: GlSetup<WebGL2RenderingContext> = (gl, world, p) => {
  const texHeight = Math.ceil(world.n / TEX_WIDTH);
  const data = new Float32Array(TEX_WIDTH * texHeight * 2);
  const tex = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RG32F,
    TEX_WIDTH,
    texHeight,
    0,
    gl.RG,
    gl.FLOAT,
    null,
  );
  gl.uniform1i(gl.getUniformLocation(p.program, "u_positions"), 0);
  gl.uniform1i(gl.getUniformLocation(p.program, "u_texWidth"), TEX_WIDTH);

  return {
    data,
    draw(w) {
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texSubImage2D(
        gl.TEXTURE_2D,
        0,
        0,
        0,
        TEX_WIDTH,
        texHeight,
        gl.RG,
        gl.FLOAT,
        data,
      );
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, w.n);
    },
  };
};

/** Positions in an RG32F texture, read with texelFetch in the vertex shader. */
export const texture = glMethod(
  gl2,
  vertex,
  fragment,
  textureStep,
  packPositionsInterleaved,
);
