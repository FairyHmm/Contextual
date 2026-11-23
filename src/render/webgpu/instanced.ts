import type { World } from "../../sim/utils/world";
import { surface } from "../utils/surface";
import type { RendererFactory } from "../utils/types";
import { CIRCLE, STYLE, rgb01 } from "../utils/visual";
import shader from "./instanced.wgsl";

// TS 7's lib.dom declares only the *Flags aliases, not the runtime enum
// objects; these are the standard WebGPU GPUBufferUsage bit values.
const USAGE = {
  COPY_DST: 0x0008,
  UNIFORM: 0x0040,
  VERTEX: 0x0020,
} as const;

/** The device and GPU objects built once in `ready`; null until it resolves. */
interface GpuState {
  device: GPUDevice;
  pipeline: GPURenderPipeline;
  instances: GPUBuffer;
  bindGroup: GPUBindGroup;
}

/** Type guard: does this RenderingContext have the WebGPU canvas methods? */
function isGPUCanvasContext(
  value: RenderingContext | null,
): value is GPUCanvasContext {
  return (
    value !== null &&
    "getCurrentTexture" in value &&
    "configure" in value &&
    "unconfigure" in value
  );
}

/** One instanced draw of a unit quad per circle. The device is created async. */
export const instanced: RendererFactory = (stage, world) => {
  const { canvas, dpr, width, height } = surface(stage, world);
  if (navigator.gpu === undefined) throw new Error("webgpu unavailable");
  const context = canvas.getContext("webgpu");
  if (!isGPUCanvasContext(context)) {
    throw new Error("webgpu context unavailable");
  }

  const format = navigator.gpu.getPreferredCanvasFormat();
  const data = new Float32Array(world.n * 2);
  // WGSL std140-like layout: vec2 size, f32 diameter, f32 radius, vec3 fill,
  // one pad float, vec3 bg, one pad float. 12 floats = 48 bytes.
  const uniformData = new Float32Array(12);
  const [fr, fg, fb] = rgb01(STYLE.FILL);
  const [br, bg, bb] = rgb01(STYLE.BACKGROUND);
  uniformData.set([
    width,
    height,
    CIRCLE.DIAMETER * dpr,
    (CIRCLE.DIAMETER * dpr) / 2,
  ]);
  uniformData.set([fr, fg, fb], 4);
  uniformData.set([br, bg, bb], 8);

  const gpu = { current: null as GpuState | null };

  const ready = (async (): Promise<void> => {
    const adapter = await navigator.gpu.requestAdapter();
    if (adapter === null) throw new Error("no webgpu adapter");
    const device = await adapter.requestDevice();
    context.configure({ device, format, alphaMode: "opaque" });

    const uniform = device.createBuffer({
      size: uniformData.byteLength,
      usage: USAGE.UNIFORM | USAGE.COPY_DST,
    });
    device.queue.writeBuffer(uniform, 0, uniformData);

    const module = device.createShaderModule({ code: shader });
    const pipeline = device.createRenderPipeline({
      layout: "auto",
      vertex: {
        module,
        entryPoint: "vs",
        buffers: [
          {
            arrayStride: 8,
            stepMode: "instance",
            attributes: [{ shaderLocation: 0, offset: 0, format: "float32x2" }],
          },
        ],
      },
      fragment: { module, entryPoint: "fs", targets: [{ format }] },
      primitive: { topology: "triangle-list" },
    });
    gpu.current = {
      device,
      pipeline,
      instances: device.createBuffer({
        size: data.byteLength,
        usage: USAGE.VERTEX | USAGE.COPY_DST,
      }),
      bindGroup: device.createBindGroup({
        layout: pipeline.getBindGroupLayout(0),
        entries: [{ binding: 0, resource: { buffer: uniform } }],
      }),
    };
  })();

  return {
    ready,
    render(w: World) {
      const state = gpu.current;
      if (state === null) return;
      for (let i = 0; i < w.n; i++) {
        data[i * 2] = w.x[i] * dpr;
        data[i * 2 + 1] = w.y[i] * dpr;
      }
      state.device.queue.writeBuffer(state.instances, 0, data);
      const encoder = state.device.createCommandEncoder();
      const pass = encoder.beginRenderPass({
        colorAttachments: [
          {
            view: context.getCurrentTexture().createView(),
            clearValue: { r: br, g: bg, b: bb, a: 1 },
            loadOp: "clear",
            storeOp: "store",
          },
        ],
      });
      pass.setPipeline(state.pipeline);
      pass.setBindGroup(0, state.bindGroup);
      pass.setVertexBuffer(0, state.instances);
      pass.draw(6, w.n);
      pass.end();
      state.device.queue.submit([encoder.finish()]);
    },
  };
};
