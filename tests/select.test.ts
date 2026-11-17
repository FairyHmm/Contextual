import { describe, expect, it } from "vitest";

import { type Entry } from "../harness/lib";
import { select } from "../harness/select";

// Method names are not unique across variants: `translate` and `transform`
// are implemented by both `html` and `svg-many`. A `--method` token therefore
// has three shapes, and these tests pin how each one resolves.

const ENTRIES: Entry[] = [
  { variant: "canvas", method: "sprite", name: "canvas/sprite" },
  { variant: "html", method: "translate", name: "html/translate" },
  { variant: "html", method: "transform", name: "html/transform" },
  { variant: "svg-many", method: "translate", name: "svg-many/translate" },
  { variant: "svg-many", method: "transform", name: "svg-many/transform" },
  { variant: "svg-path", method: "d", name: "svg-path/d" },
];

const pick = (method?: string): Entry[] => select(ENTRIES, { method }).entries;
const names = (method?: string): string[] => pick(method).map(e => e.name);

describe("select", () => {
  it("runs a whole variant when the token names one", () => {
    expect(names("html")).toEqual(["html/translate", "html/transform"]);
  });

  it("runs one method when the token is variant/method", () => {
    expect(names("svg-many/translate")).toEqual(["svg-many/translate"]);
  });

  it("runs every variant that has a bare method name", () => {
    expect(names("translate")).toEqual([
      "html/translate",
      "svg-many/translate",
    ]);
  });

  it("reports which bare names spanned variants", () => {
    expect(select(ENTRIES, { method: "translate" }).shared).toEqual([
      "translate",
    ]);
  });

  it("does not report a token that resolved to one entry", () => {
    expect(select(ENTRIES, { method: "svg-many/translate" }).shared).toEqual(
      [],
    );
    expect(select(ENTRIES, { method: "sprite" }).shared).toEqual([]);
  });

  it("reports a shared name when --method lists it among others", () => {
    const { entries, shared } = select(ENTRIES, {
      method: "svg-many/translate,sprite,translate",
    });
    expect(entries.map(e => e.name)).toEqual([
      "canvas/sprite",
      "html/translate",
      "svg-many/translate",
    ]);
    expect(shared).toEqual(["translate"]);
  });

  it("does not report a variant token as a shared name", () => {
    // `html` names a variant; no method is called `html`, so it stays out.
    expect(select(ENTRIES, { method: "html,translate" }).shared).toEqual([
      "translate",
    ]);
  });

  it("runs everything when no token is given", () => {
    expect(pick()).toHaveLength(ENTRIES.length);
  });

  it("fails on an unknown variant, method or pinned method", () => {
    expect(() => pick("webgl")).toThrow(/unknown/);
    expect(() => pick("nope")).toThrow(/unknown/);
    expect(() => pick("svg-many/nope")).toThrow(/unknown/);
  });
});
