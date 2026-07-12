import { readFileSync } from 'fs';
import { join } from 'path';
import { BadRequestException } from '@nestjs/common';
import { CsvParserService } from './csv-parser.service';

const fixturesDir = join(__dirname, '../../../test/fixtures');
const validCsv = readFileSync(join(fixturesDir, 'tickets-valid.csv'), 'utf-8');
const malformedCsv = readFileSync(join(fixturesDir, 'tickets-malformed.csv'), 'utf-8');

describe('CsvParserService', () => {
  const parser = new CsvParserService();

  it('parses valid rows with 1-based row numbers including the header', () => {
    const rows = parser.parse(validCsv);
    expect(rows).toHaveLength(3);
    expect(rows[0].row).toBe(2);
    expect(rows[0].data.subject).toBe('Cannot login to account');
  });

  it('returns an empty array for a header-only file', () => {
    const rows = parser.parse('subject,customer_name,customer_email,description\n');
    expect(rows).toEqual([]);
  });

  it('throws BadRequestException for malformed CSV', () => {
    expect(() => parser.parse(malformedCsv)).toThrow(BadRequestException);
  });

  it('trims surrounding whitespace from cell values', () => {
    const rows = parser.parse('subject,customer_name\n  Trimmed Subject  , Bob \n');
    expect(rows[0].data.subject).toBe('Trimmed Subject');
    expect(rows[0].data.customer_name).toBe('Bob');
  });

  it('handles CRLF line endings', () => {
    const rows = parser.parse('subject,customer_name\r\nHello,Alice\r\n');
    expect(rows).toHaveLength(1);
    expect(rows[0].data.subject).toBe('Hello');
  });

  it('leaves unspecified optional columns as empty strings, not missing keys', () => {
    const rows = parser.parse(validCsv);
    expect(rows[2].data.category).toBe('');
  });
});
