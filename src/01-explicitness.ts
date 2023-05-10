/**
 *
 * Problems we are facing = EXPLICITNESS
 *
 *  1. Failures
 *  2. Dependencies
 *
 */

/**
 * --------------------
 * 1. FAILURES
 * --------------------
 */

// 1.1 - No explicitness about the failure

namespace NumberGeneratorLibrary {
  export function generateRandomNumber(): number {
    const randomNumber = Math.random();

    if (randomNumber > 0.9) {
      throw new Error();
    }

    return randomNumber;
  }
}

function multiplyNumber() {
  const number = NumberGeneratorLibrary.generateRandomNumber();
  return number * 2;
}

// 1.2 - This can have for consequence that we have to handle the error in a defensive way

function defensiveMultiplyNumber() {
  try {
    const number = NumberGeneratorLibrary.generateRandomNumber();
    return number * 2;
  } catch {}
}

// 1.3 - Or we know for sure have to handle the error in a blind way

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

function isSomeOtherErrorException(exception: unknown): exception is SomeError {
  return exception instanceof Error && exception.name === "SomeError";
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
 * REWRITING THE CODE WITH EFFECT
 */

import { pipe } from "@effect/data/Function";
import * as Effect from "@effect/io/Effect";

namespace EffectNumberGeneratorLibrary {
  export function generateRandomNumber(): Effect.Effect<never, Error, number> {
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
  never,
  never,
  number
> {
  return pipe(
    EffectNumberGeneratorLibrary.generateRandomNumber(),
    Effect.flatMap((number) => Effect.succeed(number * 2)),
    Effect.catchAll(() => Effect.succeed(0))
  );
}

// Multiple errors

export class NumberIsTooBigError {
  readonly _tag = "NumberIsTooBigError";
  constructor(readonly error: string) {}
}

export class NumberIsTooSmallError {
  readonly _tag = "NumberIsTooSmallError";
  constructor(readonly error: string) {}
}

namespace Effect2NumberGeneratorLibrary {
  // @ts-ignore - ignore impl
  export function generateRandomNumber(): Effect.Effect<
    never,
    NumberIsTooBigError | NumberIsTooSmallError,
    number
  > {}
}

function multiplyNumberWhenDealingWithErrors(): Effect.Effect<
  never,
  never,
  number
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

/**
 * --------------------
 * 2. DEPENDENCIES
 * --------------------
 */

class UserAlreadyExistsError {
  readonly _tag = "  UserAlreadyExistsError";
  constructor(readonly error: string) {}
}

class CreatedUser {}

interface UserService {
  createUser: () => Effect.Effect<
    UserService,
    UserAlreadyExistsError,
    CreatedUser
  >;
}

import * as Context from "@effect/data/Context";

const UserService = Context.Tag<UserService>();

function createUser(): Effect.Effect<
  UserService,
  UserAlreadyExistsError,
  CreatedUser
> {
  return pipe(
    UserService,
    Effect.flatMap((userService) => userService.createUser())
  );
}

Effect.runPromise(
  pipe(
    createUser(),
    Effect.provideService(UserService, {
      createUser: () =>
        Effect.fail(new UserAlreadyExistsError("User already exists")),
    })
  )
);
