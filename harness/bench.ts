import { parseArgs } from "node:util";

import { FILTER_FLAGS, MOTION_FLAG, count, list, motionOf } from "./lib.ts";
import { type Mode } from "./report.ts";
import { run } from "./run.ts";

const COMMON = `  --variant a,b    only these variants (groups), e.g. canvas,html
  --method a,b     only methods with these names, in any variant
  --query k=v&k=v  extra URL params for every page (e.g. a later scenario)
  --motion line|clusters  motion scenario (default: line)
  --n 1000,5000    object counts (default 1000,5000)
  --runs 1         repeats per case, interleaved; adds a min-max Range column`;

const HELP = `pnpm bench <command> [options]

Commands:
  time     capped 60 Hz time window — perceived smoothness (FPS + dropped vsyncs)
  frames   uncapped fixed frame count — cost and the same scene state

Run "pnpm bench time --help" or "pnpm bench frames --help" for options.`;

const TIME_HELP = `pnpm bench time [options]

${COMMON}
  --seconds 5      measured window in seconds (default 5)
  --warmup 2       warm-up in seconds (default 2)
  --hz 60          refresh cap in Hz (default 60)

The sim advances by real elapsed time. A slow method presents fewer frames and
misses vsyncs; the run ends after the window.`;

const FRAMES_HELP = `pnpm bench frames [options]

${COMMON}
  --frames 300     measured frames (default 300)
  --warmup 60      warm-up frames (default 60)

The sim advances a fixed 1/60 s per frame, every method reaches the same scene
state; slower methods take longer in wall-clock time.`;

const positive = (s: string | undefined, name: string): number => {
  const n = Number(s);
  if (!Number.isFinite(n) || n <= 0) throw new Error(`bad ${name}: ${s}`);
  return n;
};

const nonNeg = (s: string | undefined, name: string): number => {
  const n = Number(s);
  if (!Number.isFinite(n) || n < 0) throw new Error(`bad ${name}: ${s}`);
  return n;
};

const whole = (s: string | undefined, name: string): number => {
  const n = Number(s);
  if (!Number.isInteger(n) || n <= 0) throw new Error(`bad ${name}: ${s}`);
  return n;
};

interface CommonValues {
  variant?: string | undefined;
  method?: string | undefined;
  query?: string | undefined;
  n?: string | undefined;
  runs?: string | undefined;
  motion?: string | undefined;
}

const commonOf = (values: CommonValues) => ({
  variant: values.variant,
  method: values.method,
  query: values.query,
  ns: list(values.n).map(count),
  runs: whole(values.runs, "runs"),
  motion: motionOf(values.motion),
});

const command = process.argv[2];
if (command === undefined || command === "--help" || command === "-h") {
  console.log(HELP);
  process.exit(0);
}
if (command !== "time" && command !== "frames") {
  console.error(`unknown command: ${command}`);
  console.log(HELP);
  process.exit(1);
}

if (command === "time") {
  const { values } = parseArgs({
    args: process.argv.slice(3),
    options: {
      ...FILTER_FLAGS,
      ...MOTION_FLAG,
      n: { type: "string", default: "1000,5000" },
      runs: { type: "string", default: "1" },
      seconds: { type: "string", default: "5" },
      warmup: { type: "string", default: "2" },
      hz: { type: "string", default: "60" },
      help: { type: "boolean", short: "h" },
    },
  });
  if (values.help === true) {
    console.log(TIME_HELP);
    process.exit(0);
  }
  const mode: Mode = {
    capped: true,
    timeBased: true,
    hz: whole(values.hz, "hz"),
    seconds: positive(values.seconds, "seconds"),
    warmupSeconds: nonNeg(values.warmup, "warmup"),
    frames: 0,
    warmup: 0,
  };
  await run({ ...commonOf(values), mode });
} else {
  const { values } = parseArgs({
    args: process.argv.slice(3),
    options: {
      ...FILTER_FLAGS,
      ...MOTION_FLAG,
      n: { type: "string", default: "1000,5000" },
      runs: { type: "string", default: "1" },
      frames: { type: "string", default: "300" },
      warmup: { type: "string", default: "60" },
      help: { type: "boolean", short: "h" },
    },
  });
  if (values.help === true) {
    console.log(FRAMES_HELP);
    process.exit(0);
  }
  const mode: Mode = {
    capped: false,
    timeBased: false,
    hz: 0,
    seconds: 0,
    warmupSeconds: 0,
    frames: whole(values.frames, "frames"),
    warmup: whole(values.warmup, "warmup"),
  };
  await run({ ...commonOf(values), mode });
}
