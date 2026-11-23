// Circle coverage shared by the WebGPU shaders. See circle.glsl for the maths.
fn circleAlpha(uv: vec2f, radiusPx: f32) -> f32 {
  let aa = 1.0 / max(radiusPx, 1.0);
  return 1.0 - smoothstep(1.0 - aa * 0.5, 1.0 + aa * 0.5, length(uv));
}