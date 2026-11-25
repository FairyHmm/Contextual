#version 300 es
precision mediump float;
uniform sampler2D u_sprite;
in vec2 v_uv;
out vec4 fragColor;

void main() {
  vec4 c = texture(u_sprite, v_uv * 0.5 + 0.5);
  if (c.a <= 0.0) discard;
  fragColor = vec4(c.rgb, 1.0);
}
