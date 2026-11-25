precision mediump float;
uniform sampler2D u_sprite;

void main() {
  vec4 c = texture2D(u_sprite, gl_PointCoord);
  if (c.a <= 0.0) discard;
  gl_FragColor = vec4(c.rgb, 1.0);
}
