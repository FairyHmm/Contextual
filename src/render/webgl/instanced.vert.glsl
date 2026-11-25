attribute vec2 a_corner;
attribute float a_x;
attribute float a_y;
uniform vec2 u_size;
uniform float u_diameter;
varying vec2 v_uv;

void main() {
  vec2 center = floor(vec2(a_x, a_y) + 0.5);
  vec2 px = center + a_corner * u_diameter;
  vec2 clip = vec2(px.x / u_size.x * 2.0 - 1.0, 1.0 - px.y / u_size.y * 2.0);
  gl_Position = vec4(clip, 0.0, 1.0);
  v_uv = a_corner * 2.0;
}
