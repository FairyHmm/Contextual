attribute float a_x;
attribute float a_y;
uniform vec2 u_size;
uniform float u_diameter;
varying float v_radius;

void main() {
  vec2 center = floor(vec2(a_x, a_y) + 0.5);
  vec2 clip = vec2(
    center.x / u_size.x * 2.0 - 1.0,
    1.0 - center.y / u_size.y * 2.0
  );
  gl_Position = vec4(clip, 0.0, 1.0);
  gl_PointSize = u_diameter;
  v_radius = u_diameter * 0.5;
}
