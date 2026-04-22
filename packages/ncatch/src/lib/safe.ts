import { type ICatch, tryCatch } from "./catch"

export namespace ISafe {
  export type Param = (...args: any[]) => unknown
}

/**
 * Wraps a function in a safe executor that never throws.
 *
 * The returned function preserves the original parameter list and,
 * when called, returns the same tuple contract as {@link tryCatch}:
 * - `[null, data]` on success
 * - `[Error, null]` on failure
 *
 * If `fn` returns a Promise, the safe executor also returns a Promise.
 *
 * @typeParam T - Function type to wrap
 * @param fn - Function to execute safely
 * @returns A function with the same parameters as `fn` and a safe tuple result
 *
 * @example
 * ```ts
 * const safeAdd = createSafeExecutor((a: number, b: number) => a + b)
 * const [err, data] = safeAdd(1, 2)
 * ```
 *
 * @example
 * ```ts
 * const safeFetchUser = createSafeExecutor(async (id: string) => ({ id }))
 * const [err, data] = await safeFetchUser("abc")
 * ```
 */
export function createSafeExecutor<T extends ISafe.Param>(fn: T) {
  return (...args: Parameters<T>): ICatch.InferReturnType<() => ReturnType<T>> => {
    const thunk = () => fn(...args) as ReturnType<T>
    return tryCatch(thunk)
  }
}
