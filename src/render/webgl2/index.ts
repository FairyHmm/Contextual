import type { VariantDef } from "../utils/types";
import { pointsMethods } from "./points";
import { quadsMethods } from "./quads";
import { texture } from "./texture";
import { vertexId } from "./vertex-id";

export const config = {
  default: "points-texture",
  methods: {
    ...quadsMethods,
    ...pointsMethods,
    "vertex-id": vertexId,
    texture,
  },
} satisfies VariantDef;
