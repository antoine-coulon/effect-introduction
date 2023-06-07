/**
 *
 * --------------------
 * 02-testing.ts
 * --------------------
 *
 * Testing is the ability of asserting that a system behaves as expected.
 * As obvious as it may seem, testing can be very tricky if the program is coupled
 * to implementation details and has implicit (hidden dependencies) that we can't control.
 * Thankfully as we saw by the end of the previous chapter, Effect leverages
 * the dependency inversion principle and explicit dependencies to favor testability.
 */

import { pipe } from "@effect/data/Function";
import * as Effect from "@effect/io/Effect";
import * as Context from "@effect/data/Context";
import * as assert from "node:assert";
import * as Either from "@effect/data/Either";

/**
 * Let's just add some boilerplate to emulate a test runner
 */
function test(name: string, testEffect: Effect.Effect<never, unknown, void>) {
  return pipe(
    testEffect,
    Effect.runSyncEither,
    Either.match(
      () => console.log(`FAILED: "${name}"`),
      () => console.log(`PASSED: "${name}"`)
    )
  );
}

class User {}

class UserCreationError {}

interface UserRepository {
  createUser: () => Effect.Effect<never, UserCreationError, User>;
}

const UserRepository = Context.Tag<UserRepository>();

const dummyUseCase = pipe(
  UserRepository,
  Effect.flatMap(({ createUser }) => createUser())
);

test(
  "Should produce a UserCreationError",
  pipe(
    Effect.gen(function* ($) {
      const result = yield* $(dummyUseCase);
      assert.deepStrictEqual(result, new User());
    }),
    /**
     * We can provide a fake implementation of the UserRepository and this approach
     * is valid for any dependency that is required within the scope of the resources
     * using during the test.
     */
    Effect.provideService(UserRepository, {
      createUser: () => Effect.succeed(new User()),
    })
  )
);

/**
 * As we can see, testing is very easy with Effect and it was thought from the ground
 * up to allow an effect description to be decoupled from its implementation details.
 */
