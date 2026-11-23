import type { VariantDef } from "../utils/types";
import { points } from "./points";

export const config = {
  default: "points",
  methods: { points },
} satisfies VariantDef;
