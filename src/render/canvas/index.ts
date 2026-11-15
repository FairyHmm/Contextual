import type { VariantDef } from "../utils/types";
import { drawingMethods } from "./drawing";
import { putImageData } from "./imagedata";
import { path2DMethods } from "./path2d";

export const config = {
  default: "sprite",
  methods: {
    ...drawingMethods,
    ...path2DMethods,
    "put-image-data": putImageData,
  },
} satisfies VariantDef;
