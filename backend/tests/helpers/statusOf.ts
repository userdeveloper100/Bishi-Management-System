/**
 * Run a function that is expected to throw an HttpError-style error and return its status.
 * Returns undefined when nothing was thrown.
 */
export function statusOf(fn: () => unknown): number | undefined {
    try {
        fn();
        return undefined;
    } catch (err) {
        return (err as { status?: number }).status;
    }
}
