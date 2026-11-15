import type { VariantDef } from "../utils/types";
import { rules } from "./rules";
import { styleMethods } from "./style";
import { typed } from "./typed";
import { varsMethods } from "./vars";

export const config = {
  default: "translate",
  methods: {
    ...styleMethods,
    ...varsMethods,
    typed,
    rules,
  },
} satisfies VariantDef;
