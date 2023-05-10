import * as Effect from "@effect/io/Effect";
import * as Fiber from "@effect/io/Fiber";
import { pipe } from "@effect/data/Function";
import * as Duration from "@effect/data/Duration";
import * as Schedule from "@effect/io/Schedule";

/**
 * RETRIES
 */

pipe(Effect.fail(new Error("Some error")), Effect.retryN(5));

pipe(
  Effect.fail(
    Math.random() > 0.5
      ? new Error("Some error")
      : new Error("Some other error")
  ),
  Effect.retryUntil((error) => error.message !== "Some error")
);

pipe(
  Effect.fail(new Error("Some error")),
  Effect.retry(Schedule.exponential(Duration.seconds(1), 0.5))
);

async function businessUseCase() {
  const random = Math.random();
  if (random > 0.9) {
    throw new Error("error1");
  }
  throw new Error("error2");
}

async function retry(
  computation: () => Promise<void>,
  times = 1,
  shouldRetry: (e: unknown) => boolean
): Promise<void> {
  try {
    await computation();
  } catch (error) {
    if (times === 0 || !shouldRetry(error)) {
      return;
    }
    return retry(computation, times - 1, shouldRetry);
  }
}

/**
 * INTERRUPTION
 */

function doSomethingInBackground() {
  setInterval(() => {}, 1000);

  return new Promise((_, reject) => {
    setTimeout(() => {
      reject(new Error("timeout"));
    }, 5000);
  });
}

// Memory Leak

// Clean interruption
pipe(
  Effect.asyncInterrupt(() => {
    const timer = setInterval(() => {}, 1000);
    return Effect.sync(() => {
      console.log("clear interval");
      clearInterval(timer);
    });
  }),
  Effect.fork,
  Effect.flatMap((fiber) => Fiber.interrupt(fiber))
);
