/**
 * Welcome to the Effect introduction!
 *
 * This introduction is not about how to write Effect code but rather focuses on
 * why Effect might be an interesting pick for writing softwares using TypeScript
 * as of today taking into account all the common problems we face as developers.
 *
 * As a rule of thumb, each developer should be aware of the problems a tool is
 * solving before even trying to take a look at the implementation details.
 * Hopefully with that short introduction you will first become aware of the
 * existing  problems and then understand how elegantly and efficiently Effect
 * solves them.
 *
 * So what is Effect?
 *
 * Effect is a well-rounded tool solving a lot of well-known software engineering
 * problems. Effect embeds a very rich set of built-in modules that can be used
 * and composed to solve real-world problems. But first things first, let's talk
 * a little bit about the Effect datatype in itself with a bit of background
 * history.
 */

import type { Effect } from "effect";

/**
 * `Effect` is the core datatype of the ecosystem, but what if I tell you that it
 * could have been called `Program` instead? The reason for that is that Effect
 * tries to model exactly what a program is, that is something that requires
 * an environment to run, that can fail with an error or succeed with a value.
 * N.B: you can see the original conversation started by @mikearnaldi here
 * https://discord.com/channels/795981131316985866/795983589644304396/948653981863923813.
 *
 * Consequently, Effect is a datatype with 3 generic type parameters:
 * `A`: represents the value that can be produced by the program
 * `E`: represents the error that can be produced by the program
 * `R`: represents the environment required to run the program
 *
 * Resulting in: Effect<A, E, R>
 *
 */

type Program<Success, Error, Environment> = Effect.Effect<
  Success,
  Error,
  Environment
>;

type Process = any;
type Stdout = any;
type Stderr = any;

/**
 * Let's just model a simple command-line interface program (with a very high
 * level of abstraction). We can say that our command line program requires
 * a process to run, that will be granted by the OS. It's represented by the
 * generic type parameter `R`. Then our program can fail with an error of type
 * `E` (Standard Error) or succeed with a value of type `A` (Standard Output).
 */

type CommandLineProgram = Program<Stdout, Stderr, Process>;

/**
 * Having these 3 generic parameters explicitly defined in the type signature
 * of our program allows us to have a very precise understanding of what our
 * program is doing and what it can produce as a result. In addition to explicitness,
 * we also have a very strong type safety guarantee that the constraint of the
 * generic type parameters will be respected by the implementation of the program.
 *
 * We'll see that just after, in "./01-explicitness.ts"
 */
