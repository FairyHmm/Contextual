import { circleStyle } from "../utils/visual";

// Shared machinery for the WebGPU variants: context, device, uniform packing
// and the per-frame draw pass. Each method supplies its own pipeline and
// buffers; the rest is identical.

// TS 7's lib.dom declares only the *Flags aliases, not the runtime enum
// objects; these are the standard WebGPU GPUBufferUsage bit values.
export const USAGE = {
  COPY_DST: 0x0008,
  UNIFORM: 0x0040,
  VERTEX: 0x0020,
  STORAGE: 0x0080,
} as const;

/** Type guard: does this RenderingContext have the WebGPU canvas methods? */
export function isGPUCanvasContext(
  value: RenderingContext | null,
): value is GPUCanvasContext {
  return (
    value !== null &&
    "getCurrentTexture" in value &&
    "configure" in value &&
    "unconfigure" in value
  );
}

/** The canvas's WebGPU context and the preferred swap-chain format. */
export interface GpuCanvas {
  context: GPUCanvasContext;
  format: GPUTextureFormat;
}

/** The WebGPU canvas context, or a clear error (secure context required). */
export function gpuCanvas(canvas: HTMLCanvasElement): GpuCanvas {
  if (navigator.gpu === undefined) throw new Error("webgpu unavailable");
  const context = canvas.getContext("webgpu");
  if (!isGPUCanvasContext(context)) {
    throw new Error("webgpu context unavailable");
  }
  return { context, format: navigator.gpu.getPreferredCanvasFormat() };
}

/** A configured device for the canvas; resolves once it is usable. */
export async function requestDevice(canvas: GpuCanvas): Promise<GPUDevice> {
  const adapter = await navigator.gpu.requestAdapter();
  if (adapter === null) throw new Error("no webgpu adapter");
  const device = await adapter.requestDevice();
  canvas.context.configure({
    device,
    format: canvas.format,
    alphaMode: "opaque",
  });
  return device;
}

/**
 * The WGSL uniform block: `vec2 size`, `f32 diameter`, `f32 radius`, `vec3
 * fill`, one pad float, `vec3 bg`, one pad float — 12 floats, 48 bytes.
 */
export function packUniforms(
  dpr: number,
  width: number,
  height: number,
): Float32Array {
  const data = new Float32Array(12);
  const style = circleStyle(dpr);
  const [fr, fg, fb] = style.fill;
  const [br, bg, bb] = style.background;
  data.set([width, height, style.diameter, style.radius]);
  data.set([fr, fg, fb], 4);
  data.set([br, bg, bb], 8);
  return data;
}

/** The render-pass clear colour for the shared background. */
export function clearColor(dpr: number): GPUColor {
  const [r, g, b] = circleStyle(dpr).background;
  return { r, g, b, a: 1 };
}

/** The pieces a frame needs; `vertices` binds slot 0 when present. */
export interface Frame {
  device: GPUDevice;
  context: GPUCanvasContext;
  pipeline: GPURenderPipeline;
  bindGroup: GPUBindGroup;
  clear: GPUColor;
  count: number;
  vertices?: GPUBuffer | undefined;
}

/** Encodes and submits one clear-and-draw pass. */
export function drawFrame(frame: Frame): void {
  const { device, context, pipeline, bindGroup, clear, count, vertices } =
    frame;
  const encoder = device.createCommandEncoder();
  const pass = encoder.beginRenderPass({
    colorAttachments: [
      {
        view: context.getCurrentTexture().createView(),
        clearValue: clear,
        loadOp: "clear",
        storeOp: "store",
      },
    ],
  });
  pass.setPipeline(pipeline);
  pass.setBindGroup(0, bindGroup);
  if (vertices !== undefined) {
    pass.setVertexBuffer(0, vertices);
    // The SoA buffer is x[0..count) then y[0..count); slot 1 starts at n*4.
    pass.setVertexBuffer(1, vertices, count * 4);
  }
  pass.draw(4, count);
  pass.end();
  device.queue.submit([encoder.finish()]);
}
