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

/** Parses `#rrggbb` into normalized [0,1] RGB channels for shaders. */
export const rgb01 = (hex: string): [number, number, number] => {
  const value = Number.parseInt(hex.slice(1), 16);
  return [
    ((value >> 16) & 255) / 255,
    ((value >> 8) & 255) / 255,
    (value & 255) / 255,
  ];
};
