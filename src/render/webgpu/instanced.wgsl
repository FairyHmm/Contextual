struct Uniforms {
  size: vec2f,
  diameter: f32,
  radius: f32,
  fill: vec3f,
  bg: vec3f,
};
@group(0) @binding(0) var<uniform> u: Uniforms;

struct VSOut {
  @builtin(position) pos: vec4f,
  @location(0) uv: vec2f,
};

#include "../utils/circle.wgsl"

@vertex
fn vs(
  @builtin(vertex_index) vi: u32,
  @location(0) x: f32,
  @location(1) y: f32
) -> VSOut {
  var corners = array<vec2f, 4>(
    vec2f(-0.5, -0.5), vec2f(0.5, -0.5),
    vec2f(-0.5, 0.5), vec2f(0.5, 0.5)
  );
  let c = corners[vi];
  let snapped = floor(vec2f(x, y) + 0.5);
  let px = snapped + c * u.diameter;
  let clip = vec2f(px.x / u.size.x * 2.0 - 1.0, 1.0 - px.y / u.size.y * 2.0);
  var out: VSOut;
  out.pos = vec4f(clip, 0.0, 1.0);
  out.uv = c * 2.0;
  return out;
}

@fragment
fn fs(in: VSOut) -> @location(0) vec4f {
  let a = circleAlpha(in.uv, u.radius);
  if a <= 0.0 {
    discard;
  }
  return vec4f(mix(u.bg, u.fill, a), 1.0);
}