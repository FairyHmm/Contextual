import { describe, expect, it } from "vitest";

import { parseParams } from "../src/shared/params";

describe("parseParams", () => {
  it("reads variant, n and seed", () => {
    expect(parseParams("?variant=svg-path&n=2000&seed=7")).toEqual({
      variant: "svg-path",
      n: 2000,
      seed: 7,
    });
  });

  it("falls back to defaults on bad input", () => {
    expect(parseParams("?variant=nope&n=-3")).toEqual({
      variant: "canvas",
      n: 100,
      seed: 1,
    });
  });
});
