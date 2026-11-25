// Shared helpers for the WebGL variants.

import { circleStyle } from "./visual";

/** A GL context, either generation. */
export type GL = WebGLRenderingContext | WebGL2RenderingContext;

/** A unit quad's four corners in triangle-strip order, offsets in [-0.5, 0.5]. */
export const QUAD_CORNERS = new Float32Array([
  -0.5, -0.5, 0.5, -0.5, -0.5, 0.5, 0.5, 0.5,
]);

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

/** An opaque WebGL context on a fresh canvas, or a clear error. */
export function glContext(
  canvas: HTMLCanvasElement,
  kind: "webgl",
): WebGLRenderingContext;
export function glContext(
  canvas: HTMLCanvasElement,
  kind: "webgl2",
): WebGL2RenderingContext;
export function glContext(
  canvas: HTMLCanvasElement,
  kind: "webgl" | "webgl2",
): GL;
export function glContext(
  canvas: HTMLCanvasElement,
  kind: "webgl" | "webgl2",
): GL {
  const attrs: WebGLContextAttributes = {
    antialias: false,
    depth: false,
    stencil: false,
  };
  const gl =
    kind === "webgl2"
      ? canvas.getContext("webgl2", attrs)
      : canvas.getContext("webgl", attrs);
  if (gl === null) throw new Error(`${kind} context unavailable`);
  return gl;
}

/** The five circle uniforms every variant's shaders share. */
export interface CircleUniforms {
  size: WebGLUniformLocation | null;
  diameter: WebGLUniformLocation | null;
  fill: WebGLUniformLocation | null;
  bg: WebGLUniformLocation | null;
  radius: WebGLUniformLocation | null;
}

/** Fetches the shared uniform locations; unused ones stay `null`. */
export function uniforms(gl: GL, program: WebGLProgram): CircleUniforms {
  return {
    size: gl.getUniformLocation(program, "u_size"),
    diameter: gl.getUniformLocation(program, "u_diameter"),
    fill: gl.getUniformLocation(program, "u_fill"),
    bg: gl.getUniformLocation(program, "u_bg"),
    radius: gl.getUniformLocation(program, "u_radius"),
  };
}

/** Sets the circle style, size and viewport from the display's pixel density. */
export function applyStyle(
  gl: GL,
  u: CircleUniforms,
  dpr: number,
  width: number,
  height: number,
): void {
  const style = circleStyle(dpr);
  gl.uniform2f(u.size, width, height);
  gl.uniform1f(u.diameter, style.diameter);
  gl.uniform1f(u.radius, style.radius);
  gl.uniform3fv(u.fill, style.fill);
  gl.uniform3fv(u.bg, style.background);
  gl.viewport(0, 0, width, height);
  gl.clearColor(
    style.background[0],
    style.background[1],
    style.background[2],
    1,
  );
}

/** A linked program plus the shared `a_corner`/`a_x`/`a_y` attribute slots. */
export interface StyledProgram {
  program: WebGLProgram;
  /** `a_corner`, or -1 for shaders that do not declare it. */
  corner: number;
  /** `a_x` and `a_y` (the SoA position floats), or -1 when absent. */
  x: number;
  y: number;
}

/**
 * Links `vs`/`fs`, puts the program in use, applies the shared circle style,
 * and resolves the shared attribute slots. A slot is -1 when the shader does
 * not declare it.
 */
export function styledProgram(
  gl: GL,
  vs: string,
  fs: string,
  dpr: number,
  width: number,
  height: number,
): StyledProgram {
  const program = link(gl, vs, fs);
  gl.useProgram(program);
  applyStyle(gl, uniforms(gl, program), dpr, width, height);
  return {
    program,
    corner: gl.getAttribLocation(program, "a_corner"),
    x: gl.getAttribLocation(program, "a_x"),
    y: gl.getAttribLocation(program, "a_y"),
  };
}

/**
 * Binds `buffer` to `index` as `size`-float vertices. `offset` is a byte offset
 * into the buffer, so one SoA buffer can feed both `a_x` (offset 0) and `a_y`
 * (offset n*4).
 */
export function bindAttrib(
  gl: GL,
  buffer: WebGLBuffer,
  index: number,
  size = 2,
  offset = 0,
): void {
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.enableVertexAttribArray(index);
  gl.vertexAttribPointer(index, size, gl.FLOAT, false, 0, offset);
}

/** Creates a buffer and reserves `byteLength` bytes for streaming uploads. */
export function dynamicBuffer(gl: GL, byteLength: number): WebGLBuffer {
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, byteLength, gl.DYNAMIC_DRAW);
  return buffer;
}

/** Creates a static buffer from `data` and binds it to `index`. */
export function staticBuffer(
  gl: GL,
  data: Float32Array,
  index: number,
): WebGLBuffer {
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
  bindAttrib(gl, buffer, index);
  return buffer;
}

/** Replaces a buffer's contents; used for the per-frame position upload. */
export function upload(gl: GL, buffer: WebGLBuffer, data: Float32Array): void {
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferSubData(gl.ARRAY_BUFFER, 0, data);
}
