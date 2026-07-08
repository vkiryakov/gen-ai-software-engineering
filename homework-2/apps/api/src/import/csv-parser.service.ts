import { Injectable } from '@nestjs/common';
import Papa from 'papaparse';
import { ImportParseError } from './import-parse.error';

const METADATA_PREFIX = 'metadata_';

/**
 * CSV → ticket-record candidates. Conventions: header row required;
 * `tags` is pipe-separated; `metadata_*` columns nest under `metadata`;
 * empty cells are omitted so Zod optionality applies downstream.
 */
@Injectable()
export class CsvParserService {
  parse(content: string): unknown[] {
    if (!content.trim()) throw new ImportParseError('CSV file is empty');

    const parsed = Papa.parse<Record<string, string>>(content.trim(), {
      header: true,
      skipEmptyLines: true,
    });

    if (parsed.errors.length > 0) {
      const first = parsed.errors[0];
      throw new ImportParseError(
        `Malformed CSV at row ${first.row ?? 'unknown'}: ${first.message}`,
      );
    }
    if (!parsed.meta.fields?.includes('customer_id')) {
      throw new ImportParseError(
        'CSV header row is missing required columns (expected customer_id, customer_email, …)',
      );
    }

    return parsed.data.map((row) => this.toRecord(row));
  }

  private toRecord(row: Record<string, string>): unknown {
    const record: Record<string, unknown> = {};
    const metadata: Record<string, string> = {};

    for (const [key, raw] of Object.entries(row)) {
      const value = raw?.trim();
      if (!value) continue;
      if (key === 'tags') {
        record.tags = value
          .split('|')
          .map((tag) => tag.trim())
          .filter(Boolean);
      } else if (key.startsWith(METADATA_PREFIX)) {
        metadata[key.slice(METADATA_PREFIX.length)] = value;
      } else {
        record[key] = value;
      }
    }

    if (Object.keys(metadata).length > 0) record.metadata = metadata;
    return record;
  }
}
