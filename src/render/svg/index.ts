import type { VariantDef } from "../utils/types";
import { manyMethods } from "./many";
import { pathMethods } from "./path";
import { shapeMethods } from "./shapes";

export const many = {
  default: "image",
  methods: { ...manyMethods, ...shapeMethods },
} satisfies VariantDef;

export const single = {
  default: "d-rel",
  methods: pathMethods,
} satisfies VariantDef;
