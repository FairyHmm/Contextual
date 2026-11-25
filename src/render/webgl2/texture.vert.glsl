#version 300 es
uniform vec2 u_size;
uniform float u_diameter;
uniform sampler2D u_positions;
uniform int u_texWidth;
out vec2 v_uv;

const vec2 corners[4] = vec2[4](
  vec2(-0.5, -0.5),
  vec2(0.5, -0.5),
  vec2(-0.5, 0.5),
  vec2(0.5, 0.5)
);

void main() {
  int id = gl_InstanceID;
  int col = id % u_texWidth;
  int row = id / u_texWidth;
  vec2 center = floor(texelFetch(u_positions, ivec2(col, row), 0).xy + 0.5);
  vec2 c = corners[gl_VertexID];
  vec2 px = center + c * u_diameter;
  vec2 clip = vec2(px.x / u_size.x * 2.0 - 1.0, 1.0 - px.y / u_size.y * 2.0);
  gl_Position = vec4(clip, 0.0, 1.0);
  v_uv = c * 2.0;
}
