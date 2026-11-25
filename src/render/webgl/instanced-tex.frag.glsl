precision mediump float;
uniform sampler2D u_sprite;
varying vec2 v_uv;

void main() {
  vec4 c = texture2D(u_sprite, v_uv * 0.5 + 0.5);
  if (c.a <= 0.0) discard;
  gl_FragColor = vec4(c.rgb, 1.0);
}
