import { type GL } from "./glsl";
import { circleStyle } from "./visual";

/** GLSL smoothstep, mirrored so the baked sprite matches the analytic shader. */
const smoothstep = (edge0: number, edge1: number, x: number): number => {
  const t = Math.min(1, Math.max(0, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
};

/** The analytic `circleAlpha`, mirrored so the baked sprite matches exactly. */
const circleAlpha = (u: number, v: number, radius: number): number => {
  const aa = 1 / Math.max(radius, 1);
  return 1 - smoothstep(1 - aa * 0.5, 1 + aa * 0.5, Math.hypot(u, v));
};

/**
 * Bakes the circle into a `diameter × diameter` RGBA sprite with the background
 * already mixed into RGB, binds it to unit 0 and points `u_sprite` at it. The
 * fragment shader then needs one sample and no `mix`; the alpha channel still
 * drives the `discard` at the rim.
 */
export function circleSprite(gl: GL, program: WebGLProgram, dpr: number): void {
  const style = circleStyle(dpr);
  const size = Math.max(1, Math.round(style.diameter));
  const [fr, fg, fb] = style.fill;
  const [br, bg, bb] = style.background;
  const pixels = new Uint8Array(size * size * 4);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = ((x + 0.5) / size) * 2 - 1;
      const v = ((y + 0.5) / size) * 2 - 1;
      const a = circleAlpha(u, v, style.radius);
      const i = (y * size + x) * 4;
      pixels[i] = Math.round((br + (fr - br) * a) * 255);
      pixels[i + 1] = Math.round((bg + (fg - bg) * a) * 255);
      pixels[i + 2] = Math.round((bb + (fb - bb) * a) * 255);
      pixels[i + 3] = Math.round(a * 255);
    }
  }

  const tex = gl.createTexture();
  if (tex === null) throw new Error("texture unavailable");
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(
    gl.TEXTURE_2D,
    0,
    gl.RGBA,
    size,
    size,
    0,
    gl.RGBA,
    gl.UNSIGNED_BYTE,
    pixels,
  );
  gl.uniform1i(gl.getUniformLocation(program, "u_sprite"), 0);
}
