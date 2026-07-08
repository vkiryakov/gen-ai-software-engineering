/**
 * File-level parse failure (malformed/empty/unrecognized file). Mapped to
 * HTTP 400 by the controller. Row-level content problems are NOT parse
 * errors — they land in the ImportSummary via Zod validation.
 */
export class ImportParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ImportParseError';
  }
}
