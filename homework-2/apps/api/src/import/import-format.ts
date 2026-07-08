import { importFormatSchema, type ImportFormat } from '@repo/contracts';

const EXTENSION_TO_FORMAT: Record<string, ImportFormat> = {
  csv: 'csv',
  json: 'json',
  xml: 'xml',
};

const MIME_TO_FORMAT: Record<string, ImportFormat> = {
  'text/csv': 'csv',
  'application/json': 'json',
  'application/xml': 'xml',
  'text/xml': 'xml',
};

/**
 * Precedence (spec): explicit ?format= override → file extension → MIME type.
 * An invalid override is a caller mistake and resolves to undefined (→ 400),
 * never silently falls through to guessing.
 */
export function resolveImportFormat(
  filename: string,
  mimetype: string,
  override?: string,
): ImportFormat | undefined {
  if (override !== undefined) {
    const parsed = importFormatSchema.safeParse(override);
    return parsed.success ? parsed.data : undefined;
  }
  const extension = filename.split('.').pop()?.toLowerCase() ?? '';
  return EXTENSION_TO_FORMAT[extension] ?? MIME_TO_FORMAT[mimetype];
}
