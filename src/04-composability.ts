import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Context from "effect/Context";
import { pipe } from "effect/Function";
import * as S from "@effect/schema/Schema";
import * as Duration from "effect/Duration";
import * as Schedule from "effect/Schedule";

const Todo = S.struct({
  id: S.number,
  completed: S.boolean,
});

type Todo = S.Schema.To<typeof Todo>;

class FetchError {
  readonly _tag = "FetchError";
  constructor(readonly id: number) {}
}

class DecodeError {
  readonly _tag = "DecodeError";
  constructor(readonly id: number) {}
}

interface TodosRepository {
  fetchTodo: (
    id: number
  ) => Effect.Effect<TodosRepository, FetchError | DecodeError, Todo>;
}

const TodosRepository = Context.Tag<TodosRepository>();

const TodosRepositoryLive = Layer.succeed(TodosRepository, {
  fetchTodo: (id) =>
    pipe(
      Effect.tryPromise({
        try: () =>
          fetch(`https://jsonplaceholder.typicode.com/todos/${id}`).then(
            (response) => response.json()
          ),
        catch: () => new FetchError(id),
      }),
      Effect.flatMap(S.parse(Todo)),
      Effect.mapError(() => new DecodeError(id))
    ),
});

const program = (ids: number[]) => {
  const schedulePolicy = pipe(
    Schedule.exponential(Duration.seconds(1), 0.5),
    Schedule.compose(Schedule.elapsed),
    Schedule.whileOutput(Duration.lessThanOrEqualTo(Duration.seconds(5)))
  );

  return pipe(
    TodosRepository,
    Effect.flatMap((repository) =>
      pipe(
        ids,
        Effect.forEach(
          (id) =>
            pipe(
              repository.fetchTodo(id),
              Effect.tap(() => Effect.logInfo(`Successfully fetched ${id}`)),
              Effect.retry(schedulePolicy)
            ),
          { concurrency: 5 }
        )
      )
    ),
    Effect.tapError(({ id }) => Effect.logError(`Error fetching ${id}`)),
    Effect.provide(TodosRepositoryLive),
    Effect.runPromise
  );
};

// run the program with a list of valid ids
// program([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]).then(console.log).catch(console.error);

// run the program with one invalid id "100000"
// program([1, 2, 3, 4, 5, 6, 7, 8, 9, 100000]).then(console.log).catch(console.error);
