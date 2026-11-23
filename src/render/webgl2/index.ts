import type { VariantDef } from "../utils/types";
import { quads } from "./quads";

export const config = {
  default: "quads",
  methods: { quads },
} satisfies VariantDef;
