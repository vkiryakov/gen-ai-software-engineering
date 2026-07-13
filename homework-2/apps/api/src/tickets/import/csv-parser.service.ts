import { BadRequestException, Injectable } from '@nestjs/common';
import { parse } from 'csv-parse/sync';
import { ImportRow } from './types';

@Injectable()
export class CsvParserService {
  parse(text: string): ImportRow[] {
    let records: Record<string, string>[];
    try {
      records = parse(text, { columns: true, skip_empty_lines: true, trim: true });
    } catch (e) {
      throw new BadRequestException(`Malformed CSV file: ${(e as Error).message}`);
    }
    return records.map((data, index) => ({ row: index + 2, data }));
  }
}
