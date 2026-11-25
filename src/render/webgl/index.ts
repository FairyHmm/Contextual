import type { VariantDef } from "../utils/types";
import { instanced, instancedTexture } from "./instanced";
import { pointsMethods } from "./points";

export const config = {
  default: "points-texture",
  methods: {
    ...pointsMethods,
    instanced,
    "instanced-texture": instancedTexture,
  },
} satisfies VariantDef;
