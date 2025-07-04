// apps/vscode-extension/src/core/result/result.ts
export type Result<T, E = Error> = Success<T> | Failure<E>;

export class Success<T> {
  constructor(public readonly value: T) {}
  isSuccess(): this is Success<T> { return true; }
  isFailure(): this is Failure<never> { return false; }
}

export class Failure<E> {
  constructor(public readonly error: E) {}
  isSuccess(): this is Success<never> { return false; }
  isFailure(): this is Failure<E> { return true; }
}