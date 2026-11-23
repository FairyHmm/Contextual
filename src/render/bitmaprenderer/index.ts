import type { VariantDef } from "../utils/types";
import { bitmap, canvas } from "./bitmap";

export const config = {
  default: "bitmap",
  methods: { bitmap, canvas },
} satisfies VariantDef;
