# A practical introduction to the whys of Effect

This introduction comes from Effect workshops I gave in which the main objective was to explain in few hours the whys of Effect coming from raw JavaScript/TypeScript.

This introduction **is not about how to write Effect code** but rather focuses on why Effect might be an interesting pick for writing softwares using TypeScript as of today taking into account all the common problems we face as developers. As a rule of thumb, each developer should be aware of the problems a tool is solving before even trying to take a look at the implementation details. Hopefully with that short introduction you will **first become aware of the existing problems** and then **understand how elegantly and efficiently Effect solves them**.

N.B: If you're already comfortable with the inner problems and wish to jump straight into the **hows of Effect**, I suggest you to take a look at the official `Effect documentation` and the excellent crashcourse from @pigoz.

## Source code

In the `src/` folder you will be able to find the examples that will be used alongside the introduction.

# Outcomes you can expect from the introduction

- Understanding most commons problems we're facing as developers
- Understanding limits we're facing as JavaScript/TypeScript developers
- Basic understanding of Effect 
- Basic understanding of an "Effect System"
 

Before diving into Effect, let's take a step back talking about what problems we commonly face as developers.
Effect is a tool in the same way as TypeScript is a tool. Our responsibility is to first understand the problems as it would help us finding the good solutions. 

What are the most common challenges we are facing when developing softwares?

- **Explicitness**
- **Testing**
- **Resilience**
- **Composability**
- **Concurrency**
- **Efficiency & Performance**
- **Tracing & Logging**
 

We'll show examples using TypeScript, but this is not only related to JavaScript/TypeScript concern. It **concerns every ecosystem, language**.
Hopefully, you'll realise that Effect is just a **tool that addresses hard problems** that we will always face, regardless the underlying ecosystem/language.
 

## Explicitness 

The ability of making a program self-describing, allowing to have a clear vision and understanding what outcomes the program can produce without having to run it.

Ideally, what we want is:

- explicit errors
- explicit dependencies
- explicit outcomes

Let's see few examples using TypeScript first, then with Effect


## Synchronous computations

```ts
function multiplyNumber() {
  const generatedNumber = NumberGeneratorLibrary.generateRandomNumber();
  //    ^ number
  return number * 2;
}
```

Unfortunately when running the code our program crashes: `Error at <anonymous>`
Without taking a look at the implementation of the `generateRandomNumber()`, we don't even know that this thing might throw an error. The consequence of that is having runtime defect makes the process just die. Think of that in a wider scope of a program, where this can be very hard to properly handle. 


```ts
export function generateRandomNumber(): number {
    const randomNumber = Math.random();

    if (randomNumber > 0.9) {
      // RIP
      throw new Error();
    }

    return randomNumber;
}
```


This behavior can be the root cause of defensive coding, for instance:

```ts
function defensiveMultiplyNumber() {
  try {
    const number = NumberGeneratorLibrary.generateRandomNumber();
    return number * 2;
  } catch {
    // Just in case
  }
}
```


Or we need to deal with runtime errors the hard way:

```ts
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
```


## Asynchronous operations

One way to model an async computation with JavaScript is using a Promise whose results is always delivered asynchronously.

```ts

function doSomething(): Promise<number> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(3)
    });
  });
}

doSomething().then(
  // Callback will be executed at some point in time (generally as soon as possible)
  () => {

  }
);
```


## Drawbacks of a Promise 😥

- Eagerly executed, hence is impure, referentially-opaque and is running computation (already a value).
- Because of the reasons above, can't be used around for writing functional programs.
- Implicit memoization of the result (either success or failure).
- Has only one generic parameter: `Promise<A>`. The error is non-generic/non-polymorphic.
- Can't depend on any contextual information.
- No control over concurrency.
- Not much built-in combinators (then) and static methods (all, allSettled, race, any).
- No builtin interruption model.
- No builtin retry logic.
   

## Alternatives 1/2

## **fp-ts**

![width:600px height:300px](https://user-images.githubusercontent.com/43391199/231682115-a9e9cf3c-e310-4eed-b7f8-2f67ccf96cde.png)

## fp-ts

fp-ts introduced primitives that allow to model such things:

Synchronous

- `IO<A>`: Synchronous computation that can't fail
- `IOEither<E, A>`: Synchronous computation that can fail with an error E

Asynchronous

- `Task<A>`: Asynchronous computation that can't fail
- `TaskEither<E, A>`: Asynchronous computation that can fail with an error E

It's a great step towards a stronger primitives, but still requires us to make a difference between async or synchronous computations. Why should we care about whether it's async or sync? We don't care!


## fp-ts

Moreover, there is still:
- no builtin control over concurrency 
- no builtin interruption
- no builtin retry
- composing/combining multiple Tasks gets quickly tricky and verbose
- difference between sync and async operations
- different data types to express computations IO, IOEither, Task, TaskEither, ReaderTaskEither...
 

## Alternatives 2/2

**Effect**

The new kid in town

![width:600px height:300px](https://user-images.githubusercontent.com/43391199/231682137-3658c039-df03-4b56-ad88-b854f4de2454.png)



## Effect

Effect is a data type that can be used to model everything at the same time:
- no distinction between synchronous/asynchronous computations, everything is just a computation
- can be used to model computations that can or can't fail, the Either datatype is embedded in the Effect one


## Effect 

But also:

- highly composable
- highly type-safe
- explicit errors and dependencies management
- builtin concurrency control
- builtin interruption 
- builtin retry
- builtin resource management (acquire/release)



The primary goal of an Effect is to act as a representation of a computation or more generally a program whose errors and dependencies are explicitely modeled.

Effect is a datatype with 3 generic parameters 

```ts
/**
 * An Effect is modeled with the datatype Effect<R, E, A>
 * (R) represents requirements a computation needs in order to be run
 * (E) represents failures a computation can produce
 * (A) represents successful outcome a computation can produce
 */ 
type Program<Requirements, Failures, Success> = Effect<Requirements, Failures, Success>;
```


## How we can improve that way of handling errors?

- Either (Result-like): solution implemented natively in Rust, Kotlin, Haskell... Can be implemented in TypeScript as well

```ts
interface Either<E, A> {
  readonly left: E;
  readonly right: A;
}

interface Result<Error, Success> extends Either<Error, Success> {}
```


Effect integrates an `Either<E, A>` under the hood of each computation, making it both easy and explicit to deal with.

```ts
type _ = Effect<R, E, A>
//                 ^__^ -> Either-like
```


Rewriting it with Effect. Let's consider some code 

```ts

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

```


Now we have to deal with the error when expecting something to not produce any failure i.e. having the return type `Effect<never, never, number>` meaning that this computation should be not be able to produce any **expected failure**(ignore the first generic as of now).

```ts
function multiplyNumberWithoutDealingWithError(): Effect.Effect<
  never,
  never,
  number
> {
  return EffectNumberGeneratorLibrary.generateRandomNumber();
  // ^ Type 'Effect<never, Error, number>' is not assignable to type 'Effect<never, never, number>'
}
```


Dealing with one error in a recoverable fashion

```ts
function multiplyNumberWhenDealingWithError(): Effect.Effect<
  never,
  never,
  number
> {
  return pipe(
    EffectNumberGeneratorLibrary.generateRandomNumber(),
    Effect.flatMap((number) => Effect.succeed(number * 2)),
    // Handling the error and returning a result value instead
    Effect.catchAll(() => Effect.succeed(0))
  );
}
```
 

We can model multiple failures using tagged classes

```ts

export class NumberIsTooBigError {
  readonly _tag = "NumberIsTooBigError";
  constructor(readonly error: string) {}
}

export class NumberIsTooSmallError {
  readonly _tag = "NumberIsTooSmallError";
  constructor(readonly error: string) {}
}

namespace Effect2NumberGeneratorLibrary {
  export function generateRandomNumber(): Effect<
    never,
    NumberIsTooBigError | NumberIsTooSmallError,
    number
  > {}
}
```


Then it's easy to deal with failures represented as a union, because we can pattern match

```ts

function multiplyNumberWhenDealingWithErrors(): Effect<never, never, number> {
  return pipe(
    Effect2NumberGeneratorLibrary.generateRandomNumber(),
    // If there is no failure
    Effect.flatMap((number) => Effect.succeed(number * 2)),
    // If there are failures, pattern match 
    Effect.catchTags({
      NumberIsTooBigError: () => Effect.succeed(0),
      NumberIsTooSmallError: () => Effect.succeed(1),
    })
  );
}

```
 

## Explicitness

**Explicit dependencies**


Effect can embed contextual information. It makes the dependencies required for the computation to be run explicit:

```ts

import * as Effect from "@effect/io/Effect";
import * as Context from "@effect/data/Context";

interface UserService {
  createUser: () => Effect.Effect<UserService, UserAlreadyExistsError, CreatedUser>;
}

const UserService = Context.Tag<UserService>();

function createUser(): Effect.Effect<UserService, UserAlreadyExistsError, CreatedUser> {
                                    // ^ dependencies
  return pipe(
    UserService,
    Effect.flatMap((userService) => userService.createUser()),
  );
}

```


What it means is that `createUser` needs an instance of some service that implements the interface `UserService`. Otherwise, the program does not compile:

```ts
  Effect.runPromise(
    createUser()
  )
  // ^ Type 'UserService' is not assignable to type 'never': ts(2345)
```

We can't compile the program because we didn't satisfy the dependencies.


## Type-safe dependency injection

```ts
Effect.runPromise(
  createUser(),
  // Dependency injection
  Effect.provideService(UserService, {
    createUser: () =>
      // We don't care about the implementation, it could be anything
      Effect.fail(new UserAlreadyExistsError("User already exists")),
  })
);
```


## Testing

Testing is the ability of asserting that a system behaves as expected. As obvious as it may seem, testing can be very tricky if the program is coupled to implementation details and has implicit (hidden dependencies) that we can't control.

Thankfully, Effect is explicit towards dependencies and favors the use of the Dependency Inversion Principle (DIP) by forcing each computation to depend on an abstraction (interface) rather than on an implementation:

```ts
interface UserService {
  createUser: () => Effect.Effect<UserService, UserAlreadyExistsError, CreatedUser>;
}

const UserService = Context.Tag<UserService>();

function createUser(): Effect.Effect<UserService, UserAlreadyExistsError, CreatedUser> {
  return pipe(
    UserService,
    // ^ Just a Tag linked to an interface, there is no implementation yet
    Effect.flatMap((userService) => userService.createUser()),
  );
}
```


Having that Dependency Inversion Principle applied together with the builtin dependency injection mechanism, we can easily test programs:

```ts

class FakeUserServiceImpl implements UserService {
  createUser() {
    // 
  }
}

it("Should do something", async () => {
  const user = await Effect.runPromise(
    pipe(
      createUser(), 
      Effect.provideService(UserService, FakeUserServiceImpl)
    )
  );
  expect(user).toEqual("something");
});

```


## Resilience

Resilience is the art of being resilient of failures that is being able to handle efficiently and recover from all types of errors.

We saw that explicitness and type-safety offered by Effect allows us to erase a whole set of bugs and cleanly deal with errors. 

`If it compiles, it works` - Michael Arnaldi (creator of Effect)

Effect is a very powerful datatype, with a deep inference mechanism making Effect programs highly type-safe. It brings the type-safety to a whole new level by using TypeScript in a excellent way.

As we saw from the "Explicitness" part, Effect forces us to deal with errors case and forces us to describe computations that are both mathematically correct and make sense from a computer science perspective.


But most of the time, we don't only want to catch error, we also want to retry with some specific logic or any other specific behavior.

Using raw TypeScript, we know how to deal with an error happening, but how can we simply retry with some business rules?

```ts
async function businessUseCase() {
  throw new Error();
}

async function retry(fn: () => Promise<void>, times = 1): Promise<void> {
  try {
    await fn();
  } catch {
    if (times === 0) {
      return;
    }
    return retry(fn, times - 1);
  }
}

retry(businessUseCase, 5);
```


Great! But now, retry X times but on a specific condition 


```ts
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

retry(
  businessUseCase,
  5,
  (error) => error instanceof Error && error.message === "error2"
)
```


As we can see, the complexity grows very quickly for simple cases. As the `retry` function gets more specific, we:
- lose flexibility
- lose composability 
- lose the ability of having an error specialization
- increase the complexity
  
If we want to combine multiple rules, that is adding a specific debounce of exponential backoff, this would become nearly unmaintainable.


Thankfully, Effect also comes in with a rich set of builtin ways to deal with `retries`.

```ts
import * as Effect from "@effect/io/Effect";
import { pipe } from "@effect/data/Function";
import * as Duration from "@effect/data/Duration";
import * as Schedule from "@effect/io/Schedule";

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
```
 

And even more complex ones

```ts
import { pipe } from "@effect/data/Function";
import * as Duration from "@effect/data/Duration";
import * as Schedule from "@effect/io/Schedule";

export const retrySchedule = pipe(
  Schedule.exponential(Duration.millis(10), 2.0),
  Schedule.either(Schedule.spaced(() => Duration.seconds(1))),
  Schedule.compose(Schedule.elapsed),
  Schedule.whileOutput(Duration.lowerThenOrEqual(Duration.seconds(30)))
);
```


Still in the context of **Resilience**, Effect also allows to model interruptions and deal with the cases where some computation gets interrupted. It allows us to model an acquire/release logic that is safe towards interruption and prevent memory leaks.

```ts
pipe(
  Effect.asyncInterrupt(() => {
    const timer = setInterval(() => {}, 1000);
    return Effect.sync(() => {
      clearInterval(timer);
    });
  }),
  Effect.fork,
  Effect.flatMap((fiber) => Fiber.interrupt(fiber))
);
```

There is a guarantee that the release Effect return by the `asyncInterrupt` method will be executed. The interruption model also allows us to have a fine-grained control over interruptibility. 


## Composability

The art of having a set of reusable software components that can be easily combined, extended, specialized and in a scalable, maintainable and understable way. 

Effect `does exactly that`. Thanks to all its primitives and very rich standard library, it allows us to model everything we need on a daily basis. 


## Composability

```ts
pipe(
  TodosRepository,
  Effect.flatMap((todosRepository) =>
    pipe(
      [1, 2, 3, 4, 5, 6, 7, 8, 9, 10],
      Effect.forEachPar(todosRepository.fetchTodo),
      Effect.withParallelism(5)
    )
  ),
  Effect.retry(
    pipe(
      Schedule.exponential(Duration.seconds(1), 0.5),
      Schedule.whileOutput((duration) => duration < Duration.seconds(30))
    )
  ),
  Effect.mapError(() => new FetchError())
);
```


## Concurrency

Concurrency is the art of running multiple computations cooperatively to improve the overall speed of the program execution.

`"concurrency is about dealing with lots of things at once"`, Rob Pike

Node.js is an example of a runtime leveraging concurrency on a single thread using an Event Loop to cooperatively execute asynchronous task.

**Reminder:** Doing a synchronous operation is faster than doing an asynchronous operation. But when combining multiple operations this is where concurrency becomes interesting.


Concurrency is very hard to do right

**Issues with Concurrency**

- Hard to get a deterministic execution model
- Shared resource problems 
- Deadlocks, resource starvation can occur
- Memory/CPU efficiency
- ... many more


**The Dining philosophers problem**, introduced in 1965 by Edsger Dijkstra

https://en.wikipedia.org/wiki/Dining_philosophers_problem

![bg left](https://user-images.githubusercontent.com/43391199/231962010-90d6020f-f18e-4e9f-83e5-fe33f14532d0.png)


Earlier with JavaScript we talked about Promises that could be used to model asynchronous computations.

The problem: `Promises don't have any builtin way of having a fine-grained control over concurrency`


We can handle concurrency very easily!

:otter: `Promise.all`, `Promise.allSettled`

`Promise.all` and `Promise.allSettled` both allow you to run concurrently X operations but:

- no easy way of having a **bounded concurrency** 
- no resource safety, all other Promises keep being executed in the background in case of failures (even in case of success for `Promise.any` or `Promise.race`)  
- no easy way of handling interruptions 


**Bounded vs Unbounded concurrency**

`Bounded` can be used to qualify a limited resource in terms of memory space, memory usage, cpu usage, anything that should be limited (bounded).

- Bounded concurrency is the art of controlling how much operations can run concurrently.
- Unbounded concurrency is the opposite, that is using `Promise.all` :smile:


Example of an `Unbounded concurrency case`

```ts
const userIds = Array.from({ length: 1000 }, (_, idx) => idx);

function fetchUser(id: number): Promise<User> {
  // 
}


function retrieveAllUsers() {
  return Promise.all(
    userIds.map((id) => fetchUser(id))
  );
}
```


All Promises were spawned at the same time, blowing up both the Event Loop and the CPU.

![bg left](https://user-images.githubusercontent.com/43391199/231975528-84b45f52-5007-4c39-95c4-6986e1873b6b.jpeg)


Effect allows us to control the number of concurrent operations very easily:

```ts
pipe(
  userIds,
  Effect.forEachPar((id) => Effect.promise(() => fetchUser(id))),
  Effect.withParallelism(30)
);
```


And also allows to deal more advanced patterns with built in modules:

- STM (Software Transactional Memory): Transactional Data Structures & Coordination
- Semaphore: Concurrency Control


Promises: no resource safety/management. Even when the Promise fulfills, the other ones keep running in the background.
This can become a problem if the scheduling of leaking Promises is done a lot. It will blow up the CPU and load the Event Loop with unecessary work.

```ts
function quickRunningPromise() {
  return new Promise((resolve) => {
    setTimeout(resolve, 0);
  });
}

function longRunningPromise() {
  return new Promise((resolve) => {
    setTimeout(resolve, 5000);
  });
}

Promise.race([quickRunningPromise(), longRunningPromise()]);
```


Effect are by nature interruptible, meaning that all these operations are ressource-safe.

```ts
const quickRunningEffect = pipe(
  Effect.delay(Duration.seconds(1))(Effect.unit())
);

const longRunningEffect = pipe(
  Effect.delay(Duration.seconds(5))(Effect.unit()),
  Effect.onInterrupt(() => {
    console.log("interrupted!");
    return Effect.unit();
  })
);

Effect.runCallback(
  Effect.race(quickRunningEffect, longRunningEffect),
  () => {
    console.log("done");
  }
);
```


One great thing is the Effect runtime will automatically perform cleanup/release of the underlying tasks once a computation is interrupted.

Remember the previous example?

```ts
const interruptibleEffectWithAutoCleanup = Effect.asyncInterrupt(() => {
  const timer = setInterval(() => {}, 1000);
  // Cleanup/Release function
  return Effect.sync(() => {
    console.log("clear interval");
    clearInterval(timer);
  });
});

```

If we race something with that Effect and it loses, the cleanup function will be automatically called, by default in the background (asynchronously) or can be a blocking operation.

There are a lot of features around that, that are out of the scope of the introduction.


## Efficiency & Performance

Efficiency and Performance are both related and unrelated at the same time.

- Performance: refers to how well a task is completed within a given time frame or how quickly a system can complete a task
- Efficiency: refers to the ratio of the output or result to the resources used to produce it

Achieving both requires careful consideration of tradeoffs and goals.

For instance, it's easy to nearly blow up the stack while the program is very performant.

Remember the `Promise.all` example? It will most likely execute faster than the Effect version, but the overall Performance of the program will be impacted (other tasks will take longer time) and Efficiency-wise, it's not ideal.


**Effect in essence**

Before going into that subject of `Efficiency & Performance`, it's important to understand the foundations of Effect.

Effect is in the first place an **Embedded Domain Specific Language (DSL)**. It uses TypeScript (Embedded) to describe a specific set of instructions that will be interpreted by a runtime (Effect Runtime). We call that DSL encoding **initial**.

Effect is _simply_ an `Embedded Domain Specific Language with Initial encoding`! 


Here is an example of a simple React DSL that helps us build Tables.

```tsx
  <Table<BrandPerformanceTurnover>>
    <Row>
      <Cell<BrandPerformanceTurnover>
        title={'something'}
        sort="enabled"
      />
    </Row>
  </Table>
```

Unlike Effect, this Table DSL is using a **Final** encoding meaning that the description is defined in terms of it's direct interpretation. In that case it means that there is a parent component that aims as an interpreter and will introspect all the children. The description is tighted to it's interpretation, not letting any room for multiple interpretations, optimizations and can be unsafe (Tables are not really concerned by that).


![bg left 50%](https://user-images.githubusercontent.com/43391199/232013993-da5f9e7e-7317-46eb-bd28-79802890ea99.png)


Let's demystify Effect


## Effect Systems

Effect is just a description! All data types are used to model a set of computations that represent our program.

One of the biggest strengths of Effect is that without even executing anything, by just leveraging mathematical concepts and the TypeScript compiler, it is already a proof of whether the program is correct or not.

`If it compiles, it works` - **Michael Arnaldi (creator of Effect)**

The whole purpose of **Effect Systems** that aim to represent side-effectful operations that a program might process at some point. The objective is to have a full control and defer at the most end the execution of all those side effects, when the program was understood by both the compiler and the runtime.

It lets room for a lot of performance, composability, substitutions, optimizations, type-safety, stack-safety, concurrency...


**Effect Systems**


`Functional effect systems like ZIO (and Haskell’s IO data type) let us take side-effects and make them more useful, by turning them into values, which we can transform and compose, solving complex problems with easy and type-safe combinators that simply can’t exist for side-effecting statements`

**John A. De Goes, (creator of ZIO, Effect ancestor)**


Now that we have described our program using the Effect DSL, how to execute the underlying computation?

We need an **Interpreter**!

Let's do that.


**Effect Runtime**

Effect comes in with a builtin **fiber-based Runtime** that interprets the description. A Fiber is a **lightweight primitive** that deals efficiently with concurrency, scheduling, resource management, interruption etc. It is often refered as a virtual thread / green thread, meaning that it leverages cooperative multitasking using its own computational context that runs independently but that can easily be joined/forked/resumed/stopped/interrupted...

Thousands and even millions of Fibers can be spawned and run in a single thread. They are much more lightweight and efficient than operating system threads. Fibers can also be dispatched to be executed within many operating system threads (ZIO uses a threadpool).

Also:
Go implements its own native version of green threads using goroutines 
Kotlin, Java have their own green threads implementation for instance
Erlang...
C#...


Let's see how to use the built in Effect runtime!


Other interesting facts about the fiber-based runtime:

- It's stack safe, because it controls the execution of operations, it's able to determine how much operations it can execute on the current tick of the Event Loop. 
- It's memory efficient because after 2048 operations, the fiber yields, letting the Event Loop breath and letting other tasks run.  
- It's overall faster, because the runtime can combine/batch/eliminate operations and tries to leverage synchronous operations as much as it can. 


## Tracing & Logging

Effect also directly embeds primitives for Logging, Tracing and even Metrics.

It can be integrated with OpenTelemetry, Prometheus, etc.



Summary

- Explicitness :white_check_mark: 
- Testing :white_check_mark: 
- Resilience :white_check_mark: 
- Composability :white_check_mark: 
- Concurrency :white_check_mark: 
- Efficiency & Performance :white_check_mark: 
- Tracing & Logging :white_check_mark: 

All that in just one tool, with TypeScript.


Also:

- @effect/schema 
- @effect/match
- @effect/cli
- @effect/process
  
And many more to come


Thanks for listening.

Questions?
