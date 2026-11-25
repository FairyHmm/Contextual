import shader from "./instanced.wgsl";
import { type GpuSetup, gpuMethod } from "./method";
import { USAGE } from "./setup";

const RING = 3;

/** Instanced quads with a small ring of vertex buffers to avoid write hazards. */
const ringStep: GpuSetup = (device, canvas, data, uniform, module) => {
  const buffers = Array.from({ length: RING }, () =>
    device.createBuffer({
      size: data.byteLength,
      usage: USAGE.VERTEX | USAGE.COPY_DST,
    }),
  );
  const pipeline = device.createRenderPipeline({
    layout: "auto",
    vertex: {
      module,
      entryPoint: "vs",
      buffers: [
        {
          arrayStride: 4,
          stepMode: "instance",
          attributes: [{ shaderLocation: 0, offset: 0, format: "float32" }],
        },
        {
          arrayStride: 4,
          stepMode: "instance",
          attributes: [{ shaderLocation: 1, offset: 0, format: "float32" }],
        },
      ],
    },
    fragment: {
      module,
      entryPoint: "fs",
      targets: [{ format: canvas.format }],
    },
    primitive: { topology: "triangle-strip" },
  });
  const bindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [{ binding: 0, resource: { buffer: uniform } }],
  });
  let current = 0;
  return {
    pipeline,
    bindGroup,
    upload(dev, src) {
      const buffer = buffers[current];
      dev.queue.writeBuffer(buffer, 0, src);
      current = (current + 1) % buffers.length;
      return buffer;
    },
  };
};

export const ring = gpuMethod(shader, ringStep);
