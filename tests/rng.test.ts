import { describe, expect, it } from "vitest";

import { mulberry32 } from "../src/shared/rng";

function take(seed: number, count: number): number[] {
  const next = mulberry32(seed);
  return Array.from({ length: count }, () => next());
}

describe("mulberry32", () => {
  it("is deterministic for the same seed", () => {
    expect(take(1, 5000)).toEqual(take(1, 5000));
  });

  it("differs between seeds", () => {
    expect(take(1, 10)).not.toEqual(take(2, 10));
  });

  it("stays within [0, 1)", () => {
    for (const x of take(42, 10000)) {
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThan(1);
    }
  });
});
