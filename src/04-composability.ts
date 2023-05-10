import * as Effect from "@effect/io/Effect";
import * as Context from "@effect/data/Context";
import { pipe } from "@effect/data/Function";
import * as Duration from "@effect/data/Duration";
import * as Schedule from "@effect/io/Schedule";

async function fetchData() {
  return fetch("https://jsonplaceholder.typicode.com/todos/1");
}

class FetchError {
  readonly _tag = "FetchError";
}

class Todo {}

interface TodosRepository {
  fetchTodo: (id: number) => Effect.Effect<TodosRepository, FetchError, Todo>;
}

const TodosRepository = Context.Tag<TodosRepository>();

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
  Effect.mapError(() => new FetchError()),
  Effect.fork
);
