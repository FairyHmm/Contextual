import shader from "./instanced.wgsl";
import { type GpuSetup, gpuMethod } from "./method";
import { USAGE } from "./setup";

/** One instanced draw of a unit quad per circle, from a vertex buffer. */
const instancedStep: GpuSetup = (device, canvas, data, uniform, module) => {
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
  const instances = device.createBuffer({
    size: data.byteLength,
    usage: USAGE.VERTEX | USAGE.COPY_DST,
  });
  const bindGroup = device.createBindGroup({
    layout: pipeline.getBindGroupLayout(0),
    entries: [{ binding: 0, resource: { buffer: uniform } }],
  });
  return {
    pipeline,
    bindGroup,
    upload(dev, src) {
      dev.queue.writeBuffer(instances, 0, src);
      return instances;
    },
  };
};

export const instanced = gpuMethod(shader, instancedStep);
