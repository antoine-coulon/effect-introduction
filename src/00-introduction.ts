import * as Effect from "@effect/io/Effect";

type Program<Requirements, Failures, Success> = Effect.Effect<
  Requirements,
  Failures,
  Success
>;

type Process = any;
type Stdout = any;
type Stderr = any;

type TerminalProgram = Program<Process, Stderr, Stdout>;
