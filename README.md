# contextual

Canvas 2D vs HTML DOM vs SVG DOM (many elements, single path): how many moving objects can each handle before the frame budget breaks?

## Usage

```sh
pnpm install
pnpm exec playwright install firefox
pnpm dev          # serve the demos, e.g. /?variant=canvas&n=1000&seed=1
pnpm test         # unit tests (seeded RNG, URL params)
pnpm smoke        # open headed Firefox at 1280x720, screenshot to out/
pnpm check        # format, typecheck, lint, test
```

## Layout

- `src/shared/`: seeded RNG, URL params, shared physics
- `src/variants/`: one renderer per variant
- `harness/`: Playwright measurement scripts
- `out/`: harness output (gitignored)
