/**
 *
 * --------------------
 * 01-explicitness.ts
 * --------------------
 *
 * The ability of making a program self-describing, allowing to have a clear
 * vision and understanding what outcomes the program can produce without having
 * to run it.
 */

/**
 * ----------------------------
 * 1. Synchronous computations
 * ----------------------------
 *
 * Let's imagine that we have a third-party library that exposes an API like that.
 * TypeScript allows us to statically type the return type of the function,
 * a "number". Everything is fine, we know that the function will return a number.
 */

namespace NumberGeneratorLibrary {
  // @ts-ignore - wait, the implementation comes right after
  export function generateRandomNumber(): number {
    // some implementation...
  }
}

function main_1() {
  const number = NumberGeneratorLibrary.generateRandomNumber();
  return number * 2;
}

// main();

/**
 * Unfortunately when running the code our program crashes: `Error at <anonymous>`
 * By taking a look at the implementation of the `generateRandomNumber()`, we
 * just discovered that this function could throw an error. The consequence of that
 * is having runtime failure that escalated as a defect because we didn't expect
 * it, making the process just die.
 */
namespace NumberGeneratorLibrary {
  export function generateRandomNumberWithImplementation(): number {
    const randomNumber = Math.random();

    if (randomNumber > 0.9) {
      throw new Error();
    }

    return randomNumber;
  }
}

/**
 * This behavior can be the root cause of many problems including defensive coding,
 * for instance:
 */
function defensiveMultiplyNumber() {
  try {
    const number = NumberGeneratorLibrary.generateRandomNumber();
    return number * 2;
  } catch {
    // Just in case
  }
}

/**
 * Another solution is dealing with errors the hard way. As you might know, JavaScript
 * errors are not typed, so we can't really know what kind of error we are dealing
 * with. The only thing we can do is introspect the Error object and try to
 * identify the error by some of its properties.
 */

class SomeError extends Error {
  constructor() {
    super();
    this.name = "SomeError";
  }
}
class SomeOtherError extends Error {
  constructor() {
    super();
    this.name = "SomeOtherError";
  }
}

function isSomeErrorException(exception: unknown): exception is SomeError {
  return exception instanceof Error && exception.name === "SomeError";
}

function isSomeOtherErrorException(
  exception: unknown
): exception is SomeOtherError {
  return exception instanceof Error && exception.name === "SomeOtherError";
}

function blindlyCatch() {
  try {
    const random = Math.random();

    if (random > 0.9) {
      throw new SomeError();
    }

    if (random > 0.8) {
      throw new SomeOtherError();
    }

    return random;
  } catch (exception: unknown) {
    if (isSomeErrorException(exception)) {
      // do something
    } else if (isSomeOtherErrorException(exception)) {
      // do something else
    }
  }
}

/**
 * The solution that we just found is not ideal and even if there is only thirty
 * lines of code, compromises must already be done because we simply lack of
 * explicitness. Having the lack of explicitness, we can't really know what the
 * program can do and what it can't do. The only way to know is by running the
 * program and see what happens and putting some defensive guards, but that's not
 * what we want.
 *
 * There must be a better way! But before taking a look at one of the Effect
 * solutions, let's take a look at the asynchronous world.
 */

/**
 * ----------------------------
 * 1. Asynchronous computations
 * ----------------------------
 *
 * Asynchronous computations are usually modeled in a different way than synchronous
 * ones. Using JavaScript, one way to model an async computation is using a Promise
 * whose results is always delivered asynchronously.
 */

function doSomethingAsync(): Promise<number> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(3);
    });
  });
}

function main_2() {
  doSomethingAsync().then(() => {
    // Callback will be invoked at some point in time, as soon as possible
  });
}

/**
 * However, Promises are both conceptually limited and lacking a lot of important
 * features to deal with common problems that we face.
 *
 * Drawbacks of a Promise 😥
 *
 * 1. Eagerly executed, hence is impure, referentially-opaque and is running computation (already a value).
 * Consequently can't be used around for writing functional programs.
 * 2. Implicit memoization of the result (either success or failure).
 * 3. Has only one generic parameter: `Promise<A>`. The error is non-generic/non-polymorphic.
 * 4. Can't depend on any contextual information.
 * 5. No control over concurrency.
 * 6. Not much built-in combinators (then) and static methods (all, allSettled, race, any).
 * 7. No builtin interruption model.
 * 8. No builtin retry logic.
 */

/**
 * 1. Eagerly executed, impure, referentially-opaque.
 *
 * A Promise is eagerly executed hence can not describe a computation, but
 * represents an already running computation that might have already completed
 * and produced a value.
 */

const main = Promise.resolve("Laziness matters").then((value) => {
  console.log(value);
  return value.concat("!");
});

/**
 * If you run that file using `tsx src/01-explicitness.ts`, you will see that
 * the program will print "Laziness matters" even though we didn't explicitely
 * run the computation. The side effect of console logging is already executed
 * and we can't do anything about it. We lose some control over the execution.
 *
 * You might already know this eager nature of a Promise, but you might not know
 * that it prevents many interesting rules to be applied. The first consequences
 * are that a Promise is impure hence referentially-opaque.
 *
 * It is impure because it produces a side effect (console logging) and it is
 * referentially-opaque because we can't substitute the Promise by its value produced
 * without changing the behavior of the program (the side effect would not be executed
 * anymore).
 */

const promise = Promise.resolve("Referential transparency matters").then(
  (value) => {
    console.log(value);
    return value.concat("!");
  }
);
const valueProduced = "Referential transparency matters!";

/**
 * If we replace the Promise by its value produced, the side effect will not be
 * executed anymore. The behavior of the program will change. A Promise
 * is said referentially-opaque (not referentially-transparent).
 *
 * Purity and referential transparency are important concepts in Functional Programming
 * because they allow you to make assumptions about the behavior of
 * your program levaraging mathematical laws (compositions and substitutions of
 * expressions, etc). Moreover, it helps reasoning about the behavior of your program
 * by just looking at the types, which is what we also target with explicitness.
 * By leveraging compilers, in our case TypeScript, we will be constrained to a
 * set of well-behaved types and principles, allowing us to eliminate whole classes
 * of bugs and unexpected behaviors.
 */

/**
 * 2. Implicit memoization of the result.
 *
 * As we already said, a Promise is eagerly executed. It means that as soon as
 * you create a Promise, the computation is already running and might have already
 * completed with a value. That value produced by the Promise is implicitly memoized
 * meaning that when the Promise is settled, the internal state of the Promise is
 * frozen and can't be changed anymore, whether the Promise is fulfilled or rejected.
 * Consequently if you want to run the same computation again, you'll need to
 * recreate the Promise from scratch. Altough this is convenient because it allows
 * subscribers to receive the value even when registering for it after the Promise
 * produced its value, this makes the behavior of a Promise non-reusable and does
 * not favor retries and compositions.
 */

const promiseWithImplicitMemoization = new Promise((resolve) => {
  console.log("Implicit memoization...");
  return resolve(1);
});

promiseWithImplicitMemoization.then(() => {
  console.log("First subscription");
  promiseWithImplicitMemoization.then(() => {
    console.log("Second subscription");
  });
});

/**
 * Without running the program, can you guess what will be printed?
 */

/**
 * 3. Has only one generic parameter: `Promise<A>`. The error is non-generic/non-polymorphic.
 *
 * Promise has only one generic parameter, which is the type of the value produced.
 * This is not really convenient because it means that the error is not reflected
 * by default in the type of the Promise. This highly restricts the type-level
 * expressiveness and forces us to deal with untyped and unknown failures.
 * We could say that only generic parameter can be used to represent the
 * error using Either/Result representations, but this model has its own limitations
 * when it comes to combining many operations together and when trying to infer
 * the type of the errors of the whole chain.
 */

/**
 * 4. Can't depend on any contextual information.
 *
 * A Promise can't explicitely encode the fact of depending on some contextual
 * information. It means that if you want to run a Promise that depends on some
 * input context, dependencies can not be explicitely modeled hence it is impossible
 * to statically constrain the Promise to only be run in a valid context i.e. with
 * all the requirements satisfied.
 *
 * This is a problem because this means that Promises can implicitely rely on hidden
 * dependencies and does not offer any flexibility when it comes to composition
 * and dependency injection. By nesting Promises, that implicit layer of dependencies
 * will grow and it will be harder to reason about the behavior and the requirements
 * of the program.
 */

interface User {}

const backofficeService = {
  userService: {} as any,

  async findUserById(id: number): Promise<User> {
    const user = await this.userService.findUserById(id);
    return {
      id: user.id,
      name: user.name,
    };
  },
};

/**
 * When taking a look at the `findUserById` method, we don't know the requirements
 * of the computation that implicitely depends on the `userService` internal property.
 * Imagine that `userService#findUserById` also relies on some other dependencies
 * that are not explicitely modeled. It will be harder to reason about the behavior
 * of the program and to know what are the requirements of the computation.
 * When having that explicitely modeled, we can take advantage of the type system
 * to statically constrain the computation to only be run in a valid context, where
 * that context is anything that satisfies the requirements of the computation.
 */

/**
 * Let's bring the Promise digression to an end.
 * Now that everyone is up-to-date with challenges we are facing dealing with synchronous
 * and asynchronous (promise-based) computations, it's time to go back on our dear
 * explicitness and see how Effect solves that.
 */

import { Effect, pipe } from "effect";

namespace EffectNumberGeneratorLibrary {
  export function generateRandomNumber(): Effect.Effect<number, Error, never> {
    return pipe(
      Effect.sync(() => Math.random()),
      Effect.flatMap((randomNumber) => {
        if (randomNumber > 0.9) {
          return Effect.fail(new Error());
        }

        return Effect.succeed(randomNumber);
      })
    );
  }
}

/**
 * In the following function, see how we write the return type of the function as
 * an Effect that can't fail with an expected error (modeled by the `never` type
 * in the second type parameter). However, because we actually have to deal with
 * the error coming from "generateRandomNumber", we are forced to manage the error
 * otherwise the code does not compile (c.f. "@ts-expect-error" directive)
 *
 * Because an Effect describes explicitely the error channel, we can benefit from
 * the inference wherever we actually use that Effect. This is a good thing because
 * it means that we are forced to deal with the error.
 */
function multiplyNumberWithoutDealingWithError(): Effect.Effect<
  never,
  never,
  number
> {
  // Can't return that as the type 'never' because we have to deal with Error
  // @ts-expect-error - we have the expected error
  return EffectNumberGeneratorLibrary.generateRandomNumber();
}

function multiplyNumberWhenDealingWithError(): Effect.Effect<
  number,
  never,
  never
> {
  return pipe(
    EffectNumberGeneratorLibrary.generateRandomNumber(),
    Effect.flatMap((number) => Effect.succeed(number * 2)),
    // Recover from the error, and produce a successful value instead
    Effect.catchAll(() => Effect.succeed(0))
  );
}

/**
 * Another benefit of having a dedicated error channel is that we can also model
 * multiple failures using tagged unions, in that case it's simply TypeScript tagged
 * classes.
 */

export class NumberIsTooBigError {
  readonly _tag = "NumberIsTooBigError";
}

export class NumberIsTooSmallError {
  readonly _tag = "NumberIsTooSmallError";
}

namespace Effect2NumberGeneratorLibrary {
  export function generateRandomNumber(): Effect.Effect<
    number,
    NumberIsTooBigError | NumberIsTooSmallError,
    never
  > {
    return pipe(
      Effect.sync(() => Math.random()),
      Effect.filterOrFail(
        (randomNumber) => randomNumber > 0.9,
        () => new NumberIsTooBigError()
      ),
      Effect.filterOrFail(
        (randomNumber) => randomNumber < 0.2,
        () => new NumberIsTooSmallError()
      )
    );
  }
}

/**
 * Note that here we are not using if/else statements because TypeScript would not
 * be able to unify the union of errors properly.
 *
 * What we are trying to achieve is unifying three types of Effects:
 *
 * 1. `Effect<never, NumberIsTooBigError, never>` (first Effect.fail)
 * 2. `Effect<never, NumberIsTooSmallError, never>` (second Effect.fail)
 * 3. `Effect<never, never, number>` (Effect.succeed)
 *
 * What we want is the type just below:
 * `Effect<never, NumberIsTooBigError | NumberIsTooSmallError, number>`
 */

namespace EffectNumberGeneratorLibraryWithUnificationProblem {
  export function generateRandomNumber(): Effect.Effect<
    number,
    NumberIsTooBigError | NumberIsTooSmallError,
    never
  > {
    return Effect.flatMap(
      Effect.sync(() => Math.random()),
      // @ts-expect-error - TypeScript can't unify the union of errors properly
      (randomNumber) => {
        if (randomNumber > 0.9) {
          return Effect.fail(new NumberIsTooBigError());
        }

        if (randomNumber < 0.2) {
          return Effect.fail(new NumberIsTooSmallError());
        }

        return Effect.succeed(randomNumber);
      }
    );
  }
}

/**
 * Thankfully, to bypass this issue, we can use Effect combinators that manage
 * unification properly (Effect.filterOrFail in the working case above). We can
 * also use the "unify" function from @effect/data.
 */

import { unify } from "effect/Unify";

namespace EffectNumberGeneratorLibraryWithCleanUnification {
  export function generateRandomNumber(): Effect.Effect<
    number,
    NumberIsTooBigError | NumberIsTooSmallError,
    never
  > {
    return Effect.flatMap(
      Effect.sync(() => Math.random()),
      unify((randomNumber) => {
        if (randomNumber > 0.9) {
          return Effect.fail(new NumberIsTooBigError());
        }

        if (randomNumber < 0.2) {
          return Effect.fail(new NumberIsTooSmallError());
        }

        return Effect.succeed(randomNumber);
      })
    );
  }
}

/**
 * Now that we have failures represented as a union, it allows us to pattern match
 * and recover from either specific failures or all failures. Depending on that
 * choice, pattern matched failures will be erased from the error channel and other
 * ones will just remain until some recovery logic is defined at some point.
 */

function multiplyNumberWithExhaustivePatternMatching(): Effect.Effect<
  number,
  never,
  // ^ exhaustive pattern matching erases all errors are we all handle them
  never
> {
  return pipe(
    Effect2NumberGeneratorLibrary.generateRandomNumber(),
    Effect.flatMap((number) => Effect.succeed(number * 2)),
    Effect.catchTags({
      NumberIsTooBigError: () => Effect.succeed(0),
      NumberIsTooSmallError: () => Effect.succeed(1),
    })
  );
}

function multiplyNumberWithPartialPatternMatching(): Effect.Effect<
  number,
  NumberIsTooBigError,
  // ^ partial pattern matching does not erase all errors
  never
> {
  return pipe(
    Effect2NumberGeneratorLibrary.generateRandomNumber(),
    Effect.flatMap((number) => Effect.succeed(number * 2)),
    Effect.catchTags({
      NumberIsTooSmallError: () => Effect.succeed(1),
    })
  );
}

/**
 * ---------------------
 * Explicit dependencies
 * ---------------------
 *
 * One thing that is often under-estimated is the importance of making the dependencies
 * of a program explicit. It has many benefits, two of them are:
 * - being aware about the requirements of a program and fight hidden dependencies,
 *   which is often related to tight and unwanted coupling
 * - being able to build dependency injection systems around it and enforce the
 *   respect of the requirements at the type-level. This is super useful for
 *   testing and faking dependencies etc
 */

class UserAlreadyExistsError {
  readonly _tag = "  UserAlreadyExistsError";
}

class CreatedUser {}

interface UserRepository {
  createUser: () => Effect.Effect<CreatedUser, UserAlreadyExistsError, never>;
}

import * as Context from "effect/Context";

const UserRepository = Context.GenericTag<UserRepository>("UserRepository");

const useCases = {
  registerUser(): Effect.Effect<
    CreatedUser,
    UserAlreadyExistsError,
    UserRepository
  > {
    return pipe(
      /**
       * Here, we are requesting an access to the dependency. This has for consequence
       * to add the type of the requested dependency in the Effect where it is used,
       * but also all the Effects that will be composed with it (in the same way it
       * works for Errors and Successes <E, A>).
       * It's important to note that the dependency is requested through the Context Tag
       * and does not refer to a concrete implementation. Later in time, we'll be
       * able to provide an implementation of our choice for that specific Tag.
       */
      UserRepository,
      Effect.flatMap((userService) => userService.createUser())
    );
  },
};

/**
 * When running the program, we need to provide an implementation for the dependency
 * used by `registerUser`. Otherwise, the program won't compile.
 * You can remove the `@ts-expect-error` directive to see the error.
 */
// @ts-expect-error - no implementation provided for the dependency
Effect.runPromise(useCases.registerUser());

/**
 * How does it work? Theorically speaking, it's very simple. The runtime interpreter
 * checks that the Effect we're trying to run has all the dependencies it needs.
 * Statically at the type-level, we're able to determine that by checking
 * the `R` type parameter of the Effect. If the `R` type parameter is "never", it
 * means that all dependencies of the Effect are satisfied. Otherwise, it means
 * that some dependencies are missing (the ones still visible in the `R` type).
 */

const _ = useCases.registerUser();
//    ^ The type of the program is Effect<UserRepository, UserAlreadyExistsError, CreatedUser>

/**
 * ------------------------------
 * Type-safe dependency injection
 * ------------------------------
 *
 * If we now want to run the Effect, what we need to do is satisfying the dependency
 * that we're missing. We can do that by providing an implementation matching the
 * expected interface for the dependency and then running the Effect.
 */
const userProgram = () =>
  pipe(
    useCases.registerUser(),
    Effect.provideService(UserRepository, {
      createUser: () => Effect.fail(new UserAlreadyExistsError()),
    }),
    Effect.runPromise
  );

/**
 * Exactly in the same fashion as for errors, dependencies are propagated as a
 * typed union. We can see that in action by introducing an effect requesting
 * two dependencies.
 */

interface DependencyA {
  _tag: "DependencyA";
}

const DependencyA = Context.GenericTag<DependencyA>("DependencyA");

interface DependencyB {
  _tag: "DependencyB";
}
const DependencyB = Context.GenericTag<DependencyB>("DependencyB");

const computation1 = pipe(
  DependencyA,
  Effect.map(() => 1)
);

const computation2 = pipe(
  DependencyB,
  Effect.map(() => 2)
);

const program = Effect.gen(function* ($) {
  // ^ See how both respective dependencies from "computation1" and "computation2"
  // now were propagated in the dependencies of our main program, represented as a typed union.
  const result1 = yield* $(computation1);
  const result2 = yield* $(computation2);

  return result1 + result2;
});

/**
 * If we want to run the program, we need to provide implementations for both
 * dependencies.
 */
const mainProgram = () =>
  pipe(
    program,
    Effect.provideService(DependencyA, { _tag: "DependencyA" }),
    Effect.provideService(DependencyB, { _tag: "DependencyB" }),
    Effect.runPromise
  );

/**
 * What's great about dependency injection with Effect is that it's completely
 * type-safe but also effectful. It means that we can provide effects building
 * implementations that are themselves effectful and that will be provided only
 * when the program will be run.
 *
 * In the example below, the implementation of the dependency depends on an asynchronous
 * operation. Effect will safely run the dependency construction and only then
 * will execute the effect relying on it.
 */

interface FeatureFlag {
  isEnabled: (moduleId: number) => Effect.Effect<boolean, never, never>;
}

const FeatureFlag = Context.GenericTag<FeatureFlag>("FeatureFlag");

const mainFeatureFlagProgram = () =>
  pipe(
    FeatureFlag,
    Effect.flatMap(({ isEnabled }) => isEnabled(250)),
    Effect.provideServiceEffect(
      FeatureFlag,
      pipe(
        Effect.promise(() => fetch("/feature-flags/250")),
        Effect.map(({ body }) => ({
          isEnabled: () =>
            Effect.succeed((body as any).isEnabled ? true : false),
        })),
        Effect.catchAll(() =>
          Effect.succeed({
            isEnabled: () => Effect.succeed(false),
          })
        )
      )
    ),
    Effect.runPromise
  );
