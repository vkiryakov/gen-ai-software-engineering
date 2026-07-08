const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Parse an inclusive lower-bound date. Bare YYYY-MM-DD values are anchored
 * at start-of-day UTC; full ISO 8601 datetimes are passed through verbatim.
 */
export function parseFrom(value: string | undefined): Date | undefined {
  if (!value) return undefined;
  return DATE_ONLY_PATTERN.test(value)
    ? new Date(`${value}T00:00:00.000Z`)
    : new Date(value);
}

/**
 * Parse an inclusive upper-bound date. Bare YYYY-MM-DD values are extended
 * to end-of-day UTC (23:59:59.999Z); full ISO 8601 datetimes are passed
 * through verbatim.
 */
export function parseTo(value: string | undefined): Date | undefined {
  if (!value) return undefined;
  return DATE_ONLY_PATTERN.test(value)
    ? new Date(`${value}T23:59:59.999Z`)
    : new Date(value);
}
