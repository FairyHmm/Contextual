#version 300 es
layout(location = 0) in vec2 a_corner;
layout(location = 1) in vec2 a_pos;
uniform vec2 u_size;
uniform float u_diameter;
out vec2 v_uv;

void main() {
  vec2 center = floor(a_pos + 0.5);
  vec2 px = center + a_corner * u_diameter;
  vec2 clip = vec2(px.x / u_size.x * 2.0 - 1.0, 1.0 - px.y / u_size.y * 2.0);
  gl_Position = vec4(clip, 0.0, 1.0);
  v_uv = a_corner * 2.0;
}
