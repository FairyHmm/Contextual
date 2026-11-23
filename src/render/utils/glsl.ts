// Shared helpers for the WebGL variants.

/** A GL context, either generation. */
export type GL = WebGLRenderingContext | WebGL2RenderingContext;

/** Compiles one shader, throwing with the driver log on failure. */
export function compile(gl: GL, type: number, src: string): WebGLShader {
  const shader = gl.createShader(type);
  if (shader === null) throw new Error("shader unavailable");
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (gl.getShaderParameter(shader, gl.COMPILE_STATUS) !== true) {
    throw new Error(`shader compile failed: ${gl.getShaderInfoLog(shader)}`);
  }
  return shader;
}

/** Links a vertex/fragment pair into a program, throwing with the log. */
export function link(gl: GL, vsSrc: string, fsSrc: string): WebGLProgram {
  const program = gl.createProgram();
  if (program === null) throw new Error("program unavailable");
  const vs = compile(gl, gl.VERTEX_SHADER, vsSrc);
  const fs = compile(gl, gl.FRAGMENT_SHADER, fsSrc);
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (gl.getProgramParameter(program, gl.LINK_STATUS) !== true) {
    throw new Error(`program link failed: ${gl.getProgramInfoLog(program)}`);
  }
  return program;
}
