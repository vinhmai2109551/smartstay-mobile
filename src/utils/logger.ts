/**
 * Central place to report errors (currently just the ErrorBoundary exports in
 * src/app/_layout.tsx and src/app/(tabs)/_layout.tsx). Logs to the console in dev only
 * — there's no crash-reporting SDK wired up yet, so there's nothing useful to do with
 * it in production.
 *
 * TODO: once a crash reporter (Sentry, Bugsnag, ...) is set up, send it here instead —
 * e.g. `Sentry.captureException(error, { extra: context });` — callers won't need to
 * change.
 */
export function logError(error: unknown, context?: Record<string, unknown>) {
  if (__DEV__) {
    console.error('[logError]', error, context);
  }
}
