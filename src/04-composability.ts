import * as Effect from "@effect/io/Effect";
import * as Layer from "@effect/io/Layer";
import * as Context from "@effect/data/Context";
import { pipe } from "@effect/data/Function";
import * as S from "@effect/schema/Schema";
import * as Duration from "@effect/data/Duration";
import * as Schedule from "@effect/io/Schedule";

const Todo = S.struct({
  id: S.number,
  completed: S.boolean,
});

type Todo = S.To<typeof Todo>;

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
              Effect.tap(() =>
                Effect.log({ level: "Info" })(`Successfully fetched ${id}`)
              ),
              Effect.retry(schedulePolicy)
            ),
          { concurrency: 5 }
        )
      )
    ),
    Effect.tapError(({ id }) =>
      pipe(`Error fetching ${id}`, Effect.log({ level: "Error" }))
    ),
    Effect.provideLayer(TodosRepositoryLive),
    Effect.runPromise
  );
};

// run the program with a list of valid ids
// program([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]).then(console.log).catch(console.error);

// run the program with one invalid id "100000"
// program([1, 2, 3, 4, 5, 6, 7, 8, 9, 100000]).then(console.log).catch(console.error);
