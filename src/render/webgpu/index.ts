import type { VariantDef } from "../utils/types";
import { instanced } from "./instanced";

export const config = {
  default: "instanced",
  methods: { instanced },
} satisfies VariantDef;
