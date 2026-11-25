import { packPositions } from "../utils/positions";
import { surface } from "../utils/surface";
import type { RendererFactory } from "../utils/types";
import {
  USAGE,
  type GpuCanvas,
  clearColor,
  drawFrame,
  gpuCanvas,
  packUniforms,
  requestDevice,
} from "./setup";

/** A device plus the shared uniform buffer, ready for a pipeline. */
export interface GpuUniform {
  device: GPUDevice;
  uniform: GPUBuffer;
}

/** Requests a device and uploads the shared uniform block. */
export async function gpuUniform(
  canvas: GpuCanvas,
  dpr: number,
  width: number,
  height: number,
): Promise<GpuUniform> {
  const device = await requestDevice(canvas);
  const data = packUniforms(dpr, width, height);
  const uniform = device.createBuffer({
    size: data.byteLength,
    usage: USAGE.UNIFORM | USAGE.COPY_DST,
  });
  device.queue.writeBuffer(uniform, 0, data);
  return { device, uniform };
}

/** What a WebGPU method builds once and runs every frame. */
export interface GpuFrame {
  pipeline: GPURenderPipeline;
  bindGroup: GPUBindGroup;
  /** Uploads `data`; returns the vertex buffer to bind, or undefined. */
  upload: (device: GPUDevice, data: Float32Array) => GPUBuffer | undefined;
}

/** The per-method setup: pipeline, buffers and bind group. */
export type GpuSetup = (
  device: GPUDevice,
  canvas: GpuCanvas,
  data: Float32Array,
  uniform: GPUBuffer,
  module: GPUShaderModule,
) => GpuFrame;

/**
 * Builds a WebGPU method: the shared surface, async device + uniform setup and
 * the per-frame write + draw. `setup` supplies the pipeline, buffers and bind
 * group. Mirrors `canvas2d.method` / `svg.many` — each method is a thin
 * declaration of what makes it different.
 */
export function gpuMethod(shader: string, setup: GpuSetup): RendererFactory {
  return (stage, world) => {
    const { canvas, dpr, width, height } = surface(stage, world);
    const surfaceGpu = gpuCanvas(canvas);
    const clear = clearColor(dpr);
    const data = new Float32Array(world.n * 2);

    const gpu = {
      current: null as { device: GPUDevice; frame: GpuFrame } | null,
    };

    const ready = (async (): Promise<void> => {
      const { device, uniform } = await gpuUniform(
        surfaceGpu,
        dpr,
        width,
        height,
      );
      const module = device.createShaderModule({ code: shader });
      gpu.current = {
        device,
        frame: setup(device, surfaceGpu, data, uniform, module),
      };
    })();

    return {
      ready,
      render(w) {
        const state = gpu.current;
        if (state === null) return;
        packPositions(data, w, dpr);
        const vertices = state.frame.upload(state.device, data);
        drawFrame({
          device: state.device,
          context: surfaceGpu.context,
          pipeline: state.frame.pipeline,
          bindGroup: state.frame.bindGroup,
          clear,
          count: w.n,
          vertices,
        });
      },
    };
  };
}
