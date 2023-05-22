/** WIP */

import { pipe } from "@effect/data/Function";
import * as Effect from "@effect/io/Effect";
import { isExit, isSuccess } from "@effect/io/Exit";

function computeEffect() {
  return Effect.sync(() => {
    console.log("From Effect::: Hello Effect introduction");
  });
}

function computePromise() {
  return new Promise((resolve) => {
    console.log("From Promise::: Hello Effect introduction.");
    resolve(void 0);
  });
}

// computeEffect();
// computePromise();

/**
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 */

const programThatDoesnotMakeAnySense = pipe(
  Effect.sync(() => Math.random()),
  Effect.flatMap(() => Effect.succeed(2)),
  Effect.map(() => 10),
  Effect.zipPar(Effect.promise(() => Promise.resolve(10)))
);

// console.log(programThatDoesnotMakeAnySense.i0);

/**
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 */

// Dumb Runtime with variants

const simpleProgram = pipe(Effect.sync(() => 5));

function run<R, E, A>(program: Effect.Effect<R, E, A>): A {
  // @ts-ignore - unsafe
  let current = program.i0;
  let exitValue = undefined;

  while (current != null) {
    switch (current._tag) {
      case "Sync": {
        exitValue = current.i0();
        current = null;
      }
      default: {
        if (current == null || current.i0 == null) {
          break;
        } else {
          current = current.i0;
        }
      }
    }
  }

  return exitValue;
}

/**
const result = run(simpleProgram);
console.log({ syncResult: result });
*/

function runCallback<R, E, A>(
  program: Effect.Effect<R, E, A>,
  cb: (result: A) => void
): void {
  cb(run(program));
}

/** 
runCallback(simpleProgram, (result) => {
  console.log({ cbResult: result });
});
*/

function runPromise<R, E, A>(program: Effect.Effect<R, E, A>): Promise<A> {
  return new Promise((resolve) => {
    resolve(run(program));
  });
}

/** 
runPromise(simpleProgram).then((result) => {
  console.log({ promiseResult: result });
});
*/

/**
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 *
 */

// Now the real runtime :D

/** 
Effect.runCallback(programThatDoesnotMakeAnySense, (exit) => {
  if (isSuccess(exit)) {
    console.log(exit.value);
  }
});

Effect.runPromise(programThatDoesnotMakeAnySense).then((result) => {
  console.log(result);
});

Effect.runPromiseExit(programThatDoesnotMakeAnySense).then((exit) => {
  if (isSuccess(exit)) {
    console.log(exit.value);
  }
});
*/
