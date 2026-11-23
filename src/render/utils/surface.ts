import type { World } from "../../sim/utils/world";

/** A canvas sized to the display's pixel density and the world's CSS size. */
export interface Surface {
  canvas: HTMLCanvasElement;
  dpr: number;
  /** Device-pixel size. */
  width: number;
  height: number;
}

/** An opaque canvas appended to the stage, sized in device pixels. */
export function surface(stage: HTMLElement, world: World): Surface {
  const dpr = window.devicePixelRatio;
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(world.width * dpr);
  canvas.height = Math.round(world.height * dpr);
  canvas.style.cssText = `display:block;width:${world.width}px;height:${world.height}px`;
  stage.append(canvas);
  return { canvas, dpr, width: canvas.width, height: canvas.height };
}
