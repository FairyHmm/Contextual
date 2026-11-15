import { CIRCLE, STYLE } from "../utils/visual";
import { circleTile, method, rgb } from "./setup";

const [BR, BG, BB] = rgb(STYLE.BACKGROUND);
const LITTLE_ENDIAN = new Uint8Array(new Uint32Array([1]).buffer)[0] === 1;
const BG_U32 = LITTLE_ENDIAN
  ? ((255 << 24) | (BB << 16) | (BG << 8) | BR) >>> 0
  : ((BR << 24) | (BG << 16) | (BB << 8) | 255) >>> 0;

/**
 * Software framebuffer: clear one ImageData, alpha-blend the sprite tile per
 * dot, then put the whole frame back. No GPU canvas draw calls.
 */
export const putImageData = method(dpr => {
  const size = Math.round(CIRCLE.DIAMETER * dpr);
  const tile = circleTile(size);
  const tileCtx = tile.getContext("2d");
  if (tileCtx === null) throw new Error("2d context unavailable");
  const src = tileCtx.getImageData(0, 0, size, size).data;
  const tile32 = new Uint32Array(src.buffer);
  const first = new Int16Array(size);
  const last = new Int16Array(size);
  for (let ty = 0; ty < size; ty++) {
    let from = -1;
    let to = -1;
    for (let tx = 0; tx < size; tx++) {
      if (tile32[ty * size + tx] >>> 24 !== 0) {
        if (from < 0) from = tx;
        to = tx;
      }
    }
    first[ty] = from;
    last[ty] = to;
  }

  const offset = CIRCLE.RADIUS * dpr;
  let buffer: { frame: ImageData; out32: Uint32Array } | null = null;

  return (ctx, w) => {
    if (buffer === null) {
      const frame = ctx.createImageData(ctx.canvas.width, ctx.canvas.height);
      buffer = { frame, out32: new Uint32Array(frame.data.buffer) };
    }
    const { frame, out32 } = buffer;
    const width = frame.width;
    const height = frame.height;
    out32.fill(BG_U32);
    const { x, y, n } = w;
    for (let i = 0; i < n; i++) {
      const px = Math.round(x[i] * dpr - offset);
      const py = Math.round(y[i] * dpr - offset);
      const y0 = Math.max(0, -py);
      const y1 = Math.min(size, height - py);
      for (let ty = y0; ty < y1; ty++) {
        const from = first[ty];
        if (from < 0) continue;
        const left = Math.max(0, px + from);
        const right = Math.min(width, px + last[ty] + 1);
        const row = (py + ty) * width;
        for (let dx = left; dx < right; dx++) {
          const v = tile32[ty * size + (dx - px)];
          const alpha = v >>> 24;
          if (alpha === 0) continue;
          const di = row + dx;
          if (alpha === 255) {
            out32[di] = v;
            continue;
          }
          const inv = 255 - alpha;
          const dst = out32[di];
          const r = Math.round(((v & 255) * alpha + (dst & 255) * inv) / 255);
          const g = Math.round(
            (((v >>> 8) & 255) * alpha + ((dst >>> 8) & 255) * inv) / 255,
          );
          const b = Math.round(
            (((v >>> 16) & 255) * alpha + ((dst >>> 16) & 255) * inv) / 255,
          );
          out32[di] = ((255 << 24) | (b << 16) | (g << 8) | r) >>> 0;
        }
      }
    }
    ctx.putImageData(frame, 0, 0);
  };
}, false);
