/**
 * Internal Result utilities.
 */
export namespace IResult {
    /**
     * Infers the resulting error state for a result tuple.
     *
     * - If `E` is already an `Error`, the resulting error type is `Error`.
     * - If `E` is `null` or `undefined`, the resulting error state becomes `null`.
     * - Otherwise the error is normalized into a generic `Error`.
     *
     * This type ensures the first element of a result tuple always resolves
     * to either `Error` or `null`.
     *
     * @template E Input error type.
     */
    export type InferErrState<E> =
        E extends InstanceType<typeof Error>
            ? Error
            : E extends null | undefined
                ? null
                : Error;
}

/**
 * Creates a typed result tuple.
 *
 * The returned tuple always follows the structure:
 *
 * `[error, data, meta]`
 *
 * The error is normalized so that it is either:
 * - `null` when no error occurred
 * - an `Error` instance otherwise
 *
 * This helper is useful for constructing deterministic results without
 * throwing exceptions.
 *
 * @template E Error input type
 * @template T Data payload type
 * @template U Metadata payload type
 *
 * @param params - Result components
 * @param params.error - Error value or `null`
 * @param params.data - Optional data payload
 * @param params.meta - Optional metadata payload
 *
 * @returns A normalized result tuple `[error, data, meta]`
 */
export function createResult<
    const E,
    const T = undefined,
    const U = undefined,
>({
    error,
    meta,
    data,
}: {
    error?: E;
    data?: T;
    meta?: U;
}): [
    error: IResult.InferErrState<E>,
    data: typeof data,
    meta: typeof meta,
] {
    let processedErr: Error | null = null;

    if (error instanceof Error) {
        processedErr = error;
    } else if (error !== null && error !== undefined) {
        processedErr = new Error(
            `Unknown ErrorType: ${error?.toString() || "non-serialisable entity"}`
        );
    }

    return [processedErr as any, data, meta];
}

/**
 * Normalizes an unknown error-like value into an `Error` instance.
 *
 * If the provided value is already an `Error`, it is returned unchanged.
 * Otherwise a new `Error` instance is created describing the unknown type.
 *
 * @param err - Any thrown or unknown value.
 * @returns A valid `Error` instance.
 */
export function createError(err: unknown) {
    return err instanceof Error
        ? err
        : new Error(
              `Unknown ErrorType: ${err?.toString?.() || "[Non Serialisable Entity]"}`
          );
}
