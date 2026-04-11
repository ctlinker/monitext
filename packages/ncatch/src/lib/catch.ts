import { createError } from "./create";

export namespace ICatch {
    /**
     * A function returning a value of type `T`.
     */
    export type FnShape<T> = () => T;

    /**
     * Accepted input for {@link tryCatch}.
     *
     * Can be:
     * - a synchronous function
     * - an async function
     * - a Promise
     */
    export type Param = FnShape<void | unknown> | Promise<void | unknown>;

    type NormalizeNever<T> = [T] extends [never] ? unknown : T;

    /**
     * Extracts the resolved return type from a {@link Param}.
     *
     * - If a function returning a Promise → unwraps the Promise
     * - If a function returning a value → returns that value
     * - If a Promise → unwraps it
     */
    type ResultOf<T extends Param> =
        T extends FnShape<Promise<infer X>> ? NormalizeNever<X> :
        T extends FnShape<infer Y> ? NormalizeNever<Y> :
        T extends Promise<infer Z> ? NormalizeNever<Z> :
        never;

    /**
     * Determines whether the final return should be wrapped in a Promise.
     *
     * If the input is async (Promise or async function),
     * the result is also async.
     */
    type InferReturnKind<T extends Param, U> =
        [T] extends [unknown] 
            ? U
            : [T] extends [Promise<any> | (() => Promise<any>)] ? Promise<U> : U;

    /**
     * Final inferred return type of {@link tryCatch}.
     *
     * Produces a tuple:
     * - `[null, data]` on success
     * - `[Error, null]` on failure
     *
     * Automatically matches async/sync behavior of the input.
     */
    export type InferReturnType<T extends Param> = InferReturnKind<
        T,
        [error: null, data: ResultOf<T>] | [error: Error, data: null]
    >;
}

/**
 * Safely executes a function or Promise and returns a tuple result.
 *
 * Instead of throwing, errors are captured and returned alongside data.
 *
 * @typeParam T - A function or Promise to evaluate
 *
 * @param param - The operation to execute:
 * - synchronous function
 * - async function
 * - Promise
 *
 * @returns
 * A tuple:
 * - `[null, data]` if successful
 * - `[Error, null]` if an error occurred
 *
 * The return type mirrors the input:
 * - sync input → sync tuple
 * - async input → Promise of tuple
 *
 * @example
 * ```ts
 * const [err, data] = tryCatch(() => 42);
 * ```
 *
 * @example
 * ```ts
 * const [err, data] = await tryCatch(async () => 42);
 * ```
 *
 * @example
 * ```ts
 * const [err, data] = await tryCatch(fetch("/api"));
 * ```
 */
export function tryCatch<T extends ICatch.Param>(
    param: T
): ICatch.InferReturnType<T> {
    if (param instanceof Promise) {
        return asyncRes(param) as ICatch.InferReturnType<T>;
    } else {
        try {
            const data = (param as () => unknown)();
            if (data instanceof Promise) {
                return asyncRes(data) as ICatch.InferReturnType<T>;
            }
            return [null, data] as unknown as ICatch.InferReturnType<T>;
        } catch (error) {
            return [createError(error), null] as unknown as ICatch.InferReturnType<T>;
        }
    }
}

/**
 * Internal helper to normalize async execution into a tuple.
 *
 * Always resolves — never rejects.
 *
 * @param param - Promise to resolve
 * @returns A Promise resolving to `[error, data]`
 */
function asyncRes<T extends Promise<unknown>>(
    param: T
): Promise<[error: null, data: Awaited<T>] | [error: Error, data: null]> {
    return new Promise(async (resolve) => {
        try {
            const data = await param;
            resolve([null, data as Awaited<T>]);
        } catch (error) {
            resolve([createError(error), null]);
        }
    });
}



/**
 * Executes a synchronous function and captures any thrown error.
 *
 * Instead of throwing, the function returns a tuple:
 *
 * `[error, data]`
 *
 * - If execution succeeds → `[null, result]`
 * - If execution throws → `[Error, null]`
 *
 * This pattern enables explicit error handling without `try/catch`
 * in calling code.
 *
 * @template T Function type
 *
 * @param fn - Function to execute safely
 *
 * @returns A result tuple `[error, data]`
 *
 * @example
 * const [err, data] = syncTry(() => JSON.parse(json));
 *
 * if (err) {
 *   console.error(err);
 * }
 */
export function trySync<T extends () => any>(fn: T) {
    let result: ReturnType<T> | null = null;
    let error: null | Error = null;

    try {
        result = fn();
    } catch (err) {
        error = createError(err);
    }

    return [error, result] as
        | [error: null, data: ReturnType<T>]
        | [error: Error, data: null];
}

/**
 * Executes an asynchronous function and captures any rejection.
 *
 * Instead of throwing or rejecting, the function returns a tuple:
 *
 * `[error, data]`
 *
 * - If the promise resolves → `[null, result]`
 * - If the promise rejects → `[Error, null]`
 *
 * Useful for simplifying async flows without nested `try/catch`.
 *
 * @template T Async function type
 *
 * @param fn - Async function to execute safely
 *
 * @returns A promise resolving to a result tuple `[error, data]`
 *
 * @example
 * const [err, data] = await tryAsync(() => fetchUser());
 */
export async function tryAsync<T extends () => Promise<any>>(fn: T) {
    let result: Awaited<ReturnType<T>> | null = null;
    let error: null | Error = null;

    try {
        result = await fn();
    } catch (err) {
        error = createError(err);
    }

    return [error, result] as
        | [error: null, data: ReturnType<T>]
        | [error: Error, data: null];
}