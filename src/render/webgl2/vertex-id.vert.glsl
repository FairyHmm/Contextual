#version 300 es
layout(location = 0) in float a_x;
layout(location = 1) in float a_y;
uniform vec2 u_size;
uniform float u_diameter;
out vec2 v_uv;

const vec2 corners[4] = vec2[4](
  vec2(-0.5, -0.5),
  vec2(0.5, -0.5),
  vec2(-0.5, 0.5),
  vec2(0.5, 0.5)
);

void main() {
  vec2 center = floor(vec2(a_x, a_y) + 0.5);
  vec2 c = corners[gl_VertexID];
  vec2 px = center + c * u_diameter;
  vec2 clip = vec2(px.x / u_size.x * 2.0 - 1.0, 1.0 - px.y / u_size.y * 2.0);
  gl_Position = vec4(clip, 0.0, 1.0);
  v_uv = c * 2.0;
}
