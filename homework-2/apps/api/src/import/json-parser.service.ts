import { Injectable } from '@nestjs/common';
import { ImportParseError } from './import-parse.error';

/** JSON → ticket-record candidates: a bare array, or a { records: [...] } envelope. */
@Injectable()
export class JsonParserService {
  parse(content: string): unknown[] {
    if (!content.trim()) throw new ImportParseError('JSON file is empty');

    let data: unknown;
    try {
      data = JSON.parse(content);
    } catch (error) {
      throw new ImportParseError(`Malformed JSON: ${(error as Error).message}`);
    }

    if (Array.isArray(data)) return data;
    if (data && typeof data === 'object' && Array.isArray((data as { records?: unknown }).records)) {
      return (data as { records: unknown[] }).records;
    }
    throw new ImportParseError(
      'JSON must be an array of tickets or an object with a "records" array',
    );
  }
}
