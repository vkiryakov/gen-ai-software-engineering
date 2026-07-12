import { BadRequestException, Injectable } from '@nestjs/common';
import { ImportRow } from './types';

@Injectable()
export class JsonParserService {
  parse(text: string): ImportRow[] {
    let parsed: unknown;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      throw new BadRequestException(`Malformed JSON file: ${(e as Error).message}`);
    }

    let rows: unknown[] | null = null;
    if (Array.isArray(parsed)) {
      rows = parsed;
    } else if (parsed && typeof parsed === 'object' && Array.isArray((parsed as { tickets?: unknown }).tickets)) {
      rows = (parsed as { tickets: unknown[] }).tickets;
    }

    if (!rows) {
      throw new BadRequestException('JSON file must be an array of tickets or an object with a "tickets" array.');
    }

    return rows.map((data, index) => ({ row: index + 1, data: data as Record<string, unknown> }));
  }
}
