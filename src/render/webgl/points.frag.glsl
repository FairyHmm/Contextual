precision mediump float;
uniform vec3 u_fill;
uniform vec3 u_bg;
varying float v_radius;

#include "../utils/circle.glsl"

void main() {
  vec2 uv = gl_PointCoord * 2.0 - 1.0;
  float a = circleAlpha(uv, v_radius);
  if (a <= 0.0) discard;
  gl_FragColor = vec4(mix(u_bg, u_fill, a), 1.0);
}
