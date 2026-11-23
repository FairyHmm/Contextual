# contextual

Canvas 2D, WebGL, WebGL2, WebGPU and BitmapRenderer vs HTML DOM vs SVG DOM (many elements, single path): how many moving objects can each handle before the frame budget breaks?

## Usage

```sh
pnpm install
pnpm exec playwright install firefox
pnpm dev          # serve the demos, e.g. /?variant=2d&n=1000&seed=1&motion=clusters
pnpm test         # unit tests (seeded RNG, URL params, physics)
pnpm smoke        # open headed Firefox at 1280x720, screenshot to out/
pnpm equivalence  # same frame, every method must match the reference (out/); --motion clusters
pnpm bench time   # capped 60 Hz: FPS, dropped vsyncs and the frame tail
pnpm bench frames # uncapped: frame cost and the same scene state
pnpm check        # format, typecheck, lint, test
```

## Layout

- `src/app/`: URL params and frame drivers
- `src/sim/`: one file per motion (`line`, `clusters`; boids later), plus `utils/` for the seeded RNG and world state (`STAGE`/`SPEED` defaults)
- `src/render/`: the renderer contract, shared visual constants (`CIRCLE`, `STYLE`), and the canvas-based variants (`canvas2d/`, `webgl/`, `webgl2/`, `webgpu/`, `bitmaprenderer/`) plus `html/` and `svg/` (shared setup plus one file per method family, aggregated by `index.ts`)
- `scripts/`: `fmt-wgsl.ts`, the WGSL formatter (`pnpm format` runs it; GLSL goes through Prettier's glsl plugin)
- `harness/`: Playwright measurement scripts
- `out/`: harness output (gitignored)
