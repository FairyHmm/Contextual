#version 300 es
precision mediump float;
uniform vec3 u_fill;
uniform vec3 u_bg;
uniform float u_radius;
in vec2 v_uv;
out vec4 fragColor;

#include "../utils/circle.glsl"

void main() {
  float a = circleAlpha(v_uv, u_radius);
  if (a <= 0.0) discard;
  fragColor = vec4(mix(u_bg, u_fill, a), 1.0);
}
