/** Circle diameter in CSS px. */
export class CIRCLE {
  static DIAMETER = 12;
  static RADIUS = CIRCLE.DIAMETER / 2;
}

/** Background and fill colours. */
export const STYLE = {
  BACKGROUND: "#1b1d27",
  FILL: "#7aa2f7",
};

/** Parses `#rrggbb` into 8-bit RGB channels [0,255]. */
export const rgb = (hex: string): [number, number, number] => {
  const value = Number.parseInt(hex.slice(1), 16);
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255];
};

/** Parses `#rrggbb` into normalized [0,1] RGB channels for shaders. */
export const rgb01 = (hex: string): [number, number, number] => {
  const [r, g, b] = rgb(hex);
  return [r / 255, g / 255, b / 255];
};

/** Circle geometry and colours in device pixels, for the shader backends. */
export const circleStyle = (dpr: number) => ({
  diameter: CIRCLE.DIAMETER * dpr,
  radius: (CIRCLE.DIAMETER * dpr) / 2,
  fill: rgb01(STYLE.FILL),
  background: rgb01(STYLE.BACKGROUND),
});
