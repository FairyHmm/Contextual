import type { VariantDef } from "../utils/types";
import { instanced } from "./instanced";
import { ring } from "./ring";
import { storage } from "./storage";

export const config = {
  default: "instanced",
  methods: { instanced, storage, ring },
} satisfies VariantDef;
