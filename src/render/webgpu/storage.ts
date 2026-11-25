import { type GpuSetup, gpuMethod } from "./method";
import { USAGE } from "./setup";
import shader from "./storage.wgsl";

/** Instanced quads reading centers from a storage buffer via instance_index. */
const storageStep: GpuSetup = (device, canvas, data, uniform, module) => {
  const centers = device.createBuffer({
    size: data.byteLength,
    usage: USAGE.STORAGE | USAGE.COPY_DST,
  });
  const pipeline = device.createRenderPipeline({
    layout: "auto",
    vertex: { module, entryPoint: "vs" },
    fragment: {
      module,
      entryPoint: "fs",
      targets: [{ format: canvas.format }],
    },
    primitive: { topology: "triangle-strip" },
  });
  const bindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [
      { binding: 0, resource: { buffer: uniform } },
      { binding: 1, resource: { buffer: centers } },
    ],
  });
  return {
    pipeline,
    bindGroup,
    upload(dev, src) {
      dev.queue.writeBuffer(centers, 0, src);
      return undefined;
    },
  };
};

export const storage = gpuMethod(shader, storageStep);
