/**
 *
 * ----------------
 * 03-resilience.ts
 * ----------------
 *
 * Resilience is the art of designing and implementing software systems that can
 * gracefully and efficiently recover from most types of failures. Recovering
 * there including retrying, circuit breaking, timeouts, resource release, etc.
 */

import { setTimeout } from "node:timers/promises";
import { setTimeout as setTimeoutCb } from "node:timers";

import { Duration, Effect, Fiber, pipe, Schedule } from "effect";
import { DurationValue } from "effect/Duration";
/**
 * Retrying is a core part of resilience and it is a very common pattern to recover
 * from errors. However, each system has its own set of constraints, meaning that
 * there is no one-size-fits-all solution for retrying. Ideally what we want is
 * a solution to compose and combine different retrying strategies.
 *
 * Let's start by adding a simple computation that always fails together with
 * a simple `retry` function that can retry X times the provided computation.
 */

async function businessUseCase() {
  throw new Error("Some Failure");
}

async function retry(
  computation: () => Promise<void>,
  times = 1
): Promise<void> {
  try {
    await computation();
  } catch {
    if (times === 0) {
      return;
    }
    return retry(computation, times - 1);
  }
}

const programWithSimpleRetry = () => retry(businessUseCase, 5);

// uncomment to run
// programWithSimpleRetry();

/**
 * Great, we are able to retry the computation as many times as we want! But what
 * if we want to retry both X times but also on a specific condition?
 * Let's write that function. Basically, it just takes an additional function that
 * will be evaluated on each failure, before deciding whether to retry or not.
 */

async function businessUseCaseWithFailureVariants() {
  const random = Math.random();
  if (random > 0.9) {
    throw new Error("error_1");
  }
  throw new Error("error_2");
}

async function retryUntil(
  computation: () => Promise<void>,
  times = 1,
  shouldRetry: (e: unknown) => boolean
): Promise<void> {
  try {
    await computation();
  } catch (error) {
    console.log("Retry");
    if (times === 0 || !shouldRetry(error)) {
      return;
    }
    return retryUntil(computation, times - 1, shouldRetry);
  }
}

/**
 * We are now able to provide a specialized function that will be evaluated on each
 * failure.
 */

const programWithRetryUntil = () =>
  retryUntil(
    businessUseCaseWithFailureVariants,
    5,
    (error) => error instanceof Error && error.message === "error_2"
  );

// uncomment to run
// programWithRetryUntil();

/**
 * As we can see, the complexity grows very quickly for simple cases. As the `retry`
 * function gets more specific, we:
 * - lose flexibility
 * - lose composability
 * - lose the ability of having an error specialization
 * - increase the complexity
 *
 * For instance in most real-world scenarios, we would want to add time delays
 * between retries, bound the retrying with a maximum duration, etc. Writing it
 * all in that fashion would be very tedious and error-prone.
 *
 * Note that we also don't have any way to infer the error type of the computation
 * for the `shouldRetry` function. We are still dealing with opaque errors.
 *
 * I'll let you implement the function matching these requirements:
 *
 * - should be able to retry N times
 * - should be able to retry until a specific condition is met
 * - should be able to a delay of X milliseconds between each retry
 * - should be able to retry the whole previous chain until a specific duration
 *   is reached
 *
 * ...or you can just avoid headaches, and use Effect.
 *
 * Effect provides a lot of combinators to build retrying fully customisable and
 * human-readable strategies.
 */

const computationWithFiveRetries = pipe(
  Effect.fail(new Error("Some error")),
  // Number of retries
  Effect.retry({ times: 5 })
);

const computationWithRetryUntil = pipe(
  Effect.sync(() => Math.random()),
  Effect.flatMap((random) =>
    Effect.fail(
      random > 0.5 ? new Error("Forbidden") : new Error("Unauthorized")
    )
  ),
  // Retry until the condition is met
  Effect.retry({
    until: (error) => error.message !== "Forbidden",
  })
);

/**
 * Let's implement the retry strategy challenged above.
 * I challenge you to implement the same strategy in few lines of code,
 * in a very explicit, elegant and composable way using vanilla JS/TS :)
 */
pipe(
  Effect.fail(new Error("Some_error")),
  Effect.tapError((e) =>
    Effect.sync(() => console.error("Error occurred:", e.message))
  ),
  Effect.retry(
    pipe(
      // Number of retries
      Schedule.recurs(5),
      // Delay between each retry
      Schedule.addDelay(() => Duration.millis(500)),
      // Retry until a duration is reached
      Schedule.compose(Schedule.elapsed),
      Schedule.whileOutput(Duration.lessThanOrEqualTo(Duration.seconds(3))),
      // Retry until a condition is met
      Schedule.whileInput(
        (error) => error instanceof Error && error.message !== "_"
      )
    )
  ),
  Effect.catchAll(() => Effect.sync(() => console.log("Program ended")))
  // uncomment to run
  // Effect.runFork
);

/**
 * -------------
 * Interruptions
 * -------------
 *
 * Still in the context of Resilience, Effect also allows to deal with
 * interruptions thanks to its concurrency model based on Fibers.
 *
 * Let's take the example of a simple job running, using a
 * `setInterval` processing literally nothing.
 */

const leakingRace = () => Promise.race([setTimeout(1000), setTimeout(10000)]);

// uncomment to run, and see that the event loop hangs for 10 seconds, waiting
// for the `setTimeout(10000)` to release the timer
// leakingRace();

/**
 * One better way of doing that would be to use the `AbortController` Web API
 * that allows us to provide signal to asynchronous computations, and signal
 * them to abort their current execution.
 */
function makeRace() {
  const abortController1 = new AbortController();
  const abortController2 = new AbortController();

  async function cancellableTimeout1() {
    await setTimeout(1000, undefined, { signal: abortController1.signal });
    console.log("Aborting timeout 2");
    abortController2.abort();
  }

  async function cancellableTimeout2() {
    await setTimeout(10000, undefined, { signal: abortController2.signal });
    console.log("Aborting timeout 1");
    abortController1.abort();
  }

  return Promise.race([cancellableTimeout1(), cancellableTimeout2()]);
}

// uncomment to run
// makeRace();

async function backgroundJob() {
  const processTime = 2000;
  const interval = setInterval(() => {
    console.log("process something...");
  }, 500);

  try {
    await setTimeout(processTime);
  } finally {
    console.log("releasing resources...");
    clearInterval(interval);
  }
}

/**
 * What about being able to cancel the background job from the outside?
 */
async function backgroundJobWithCancellation(signal: AbortSignal) {
  const processTime = 10_000;

  if (signal.aborted) {
    return;
  }

  let interval: NodeJS.Timer;

  signal.addEventListener(
    "abort",
    () => {
      console.log("Aborting job, releasing resources...");
      clearInterval(interval);
    },
    {
      once: true,
    }
  );

  interval = setInterval(() => {
    console.log("process something...");
  }, 1000);

  try {
    await setTimeout(processTime, undefined, { signal });
  } finally {
    clearInterval(interval);
  }
}

/**
 * However we are still leaking something now that we added a listener to the
 * "abort" event. The listener will be kept in memory until the signal is
 * triggered, but the event might not be triggered at all if the computation
 * finishes before. Consequently, we must also be sure to cancel the event listener
 * in case the computation finishes before the signal is triggered.
 */

async function backgroundJobWithCancellationWithNoLeaks(signal: AbortSignal) {
  console.log("Starting job...");
  const processTime = 10_000;

  if (signal.aborted) {
    return;
  }

  let interval: NodeJS.Timer;
  const abortController = new AbortController();

  signal.addEventListener(
    "abort",
    () => {
      console.log("Aborting job, releasing interval...");
      clearInterval(interval);
    },
    {
      once: true,
      signal: abortController.signal,
    }
  );

  interval = setInterval(() => {
    console.log("Process something...");
  }, 250);

  try {
    await setTimeout(processTime, undefined, { signal });
  } finally {
    console.log("Releasing resources...");
    clearInterval(interval);
    abortController.abort();
  }
}

async function backgroundJobProgram() {
  const controller = new AbortController();

  // later in time
  setTimeoutCb(() => {
    controller.abort();
  }, 1000);

  await backgroundJobWithCancellationWithNoLeaks(controller.signal);
}

// uncomment to run
// backgroundJobProgram().catch(({ message }) => console.error(message));

/**
 * `asyncInterrupt` allows us to way to describe an asynchronous side-effect
 * plus offers us the control over its interruption. The Effect returned in the
 * `asyncInterrupt` body is called the Canceller, it's the Effect in charge of
 * clearing up the asynchronous operation.
 */
const backgroundJobWithEffect = pipe(
  Effect.async(() => {
    const timer = setInterval(() => {
      console.log("processing job...");
    }, 500);

    return pipe(
      Effect.sync(() => {
        console.log("clearing interval...");
        clearInterval(timer);
      })
    );
  })
);

/**
 * Now that we modeled our job that should be cancellable, we can run it in a
 * child Fiber so that the computation can be interrupted from the outside, in
 * that case it would be the root Fiber. To run a computation inside a child Fiber
 * whose lifecycle is independent from the root Fiber, we can use the `fork` method.
 * Forking gives us a reference to the Fiber being forked, so that we can interrupt
 * it later if we want to.
 *
 * In that specific example, we want to interrupt the child Fiber after 2 seconds
 * of execution, so that we can see that the interval is properly cancelled.
 */
const backgroundJobEffectProgram = pipe(
  backgroundJobWithEffect,
  Effect.fork,
  Effect.flatMap((fiber) =>
    pipe(Fiber.interrupt(fiber), Effect.delay(Duration.seconds(2)))
  )
  // uncomment to run
  // Effect.runFork
);

/**
 * As it was said in the introduction, Effect embeds its own way of scheduling
 * timers, the prefered way to do that would be to use `Effect.repeat` and its
 * variants, in that case `forever` is a repeat schedule that recurs forever.
 * You can consider it as a non-blocking `while(true)` loop.
 */
const backgroundJobWithEffectRepeat = pipe(
  Effect.async<void, never, never>((resume) => {
    console.log("starting job");

    const timeout = setTimeoutCb(() => {
      console.log("job done");
      resume(Effect.unit);
    }, 250);

    return Effect.sync(() => {
      clearTimeout(timeout);
      console.log("job cancelled");
    });
  }),
  Effect.forever,
  Effect.onInterrupt(() => Effect.sync(() => console.log("interrupted")))
);

const backgroundJobEffectRepeatProgram = pipe(
  backgroundJobWithEffectRepeat,
  Effect.fork,
  Effect.flatMap((fiberId) =>
    pipe(Fiber.interrupt(fiberId), Effect.delay(Duration.seconds(2)))
  )
  // uncomment to run
  // Effect.runFork
);

/**
 * Effect manages to deal with nested interruption, meaning that if a Fiber is
 * interrupted, all its current operations will be interrupted as well. Let's
 * see that in action where a child Fiber performs a concurrent operation involving
 * three tasks that are all interrupted when the child Fiber is interrupted.
 */

const asMillis = (duration: DurationValue): number =>
  duration._tag === "Millis" ? duration.millis : 0;

const backgroundJobWithEffectNested = pipe(
  [Duration.seconds(1), Duration.seconds(2), Duration.seconds(3)],
  Effect.forEach(
    (duration) =>
      pipe(
        Effect.delay(duration)(
          pipe(
            Effect.sync(() => {
              console.log(
                `Done task with ${asMillis(duration.value)}ms duration`
              );
            })
          )
        ),
        Effect.onInterrupt(() =>
          Effect.sync(() =>
            console.log(
              `Interrupted task with ${asMillis(duration.value)}s duration`
            )
          )
        )
      ),
    {
      concurrency: "unbounded",
    }
  ),
  Effect.onInterrupt(() =>
    Effect.sync(() => console.log("Interrupted the whole job"))
  )
);

const backgroundJobEffectNestedProgram = pipe(
  backgroundJobWithEffectNested,
  Effect.fork,
  Effect.flatMap((fiberId) =>
    Effect.delay(Duration.seconds(2))(Fiber.interrupt(fiberId))
  )
  // uncomment to run
  // Effect.runFork
);
