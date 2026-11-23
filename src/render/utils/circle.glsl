// Circle coverage shared by the WebGL point-sprite and instanced-quad shaders.
// `uv` in [-1,1]; `radiusPx` is the radius in device pixels. The ~1 px fade is
// centered on the true radius (uv length 1.0) so it straddles the edge. GLSL.
float circleAlpha(vec2 uv, float radiusPx) {
  float aa = 1.0 / max(radiusPx, 1.0);
  return 1.0 - smoothstep(1.0 - aa * 0.5, 1.0 + aa * 0.5, length(uv));
}
