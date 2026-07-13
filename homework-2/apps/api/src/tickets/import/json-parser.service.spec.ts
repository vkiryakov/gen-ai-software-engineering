import { readFileSync } from 'fs';
import { join } from 'path';
import { BadRequestException } from '@nestjs/common';
import { JsonParserService } from './json-parser.service';

const fixturesDir = join(__dirname, '../../../test/fixtures');
const validJson = readFileSync(join(fixturesDir, 'tickets-valid.json'), 'utf-8');
const malformedJson = readFileSync(join(fixturesDir, 'tickets-malformed.json'), 'utf-8');

describe('JsonParserService', () => {
  const parser = new JsonParserService();

  it('parses a top-level array with 1-based row numbers', () => {
    const rows = parser.parse(validJson);
    expect(rows).toHaveLength(2);
    expect(rows[0].row).toBe(1);
    expect(rows[1].row).toBe(2);
  });

  it('parses an object with a "tickets" array', () => {
    const rows = parser.parse(JSON.stringify({ tickets: [{ subject: 'A' }, { subject: 'B' }] }));
    expect(rows).toHaveLength(2);
    expect(rows[0].data.subject).toBe('A');
  });

  it('throws BadRequestException for malformed JSON syntax', () => {
    expect(() => parser.parse(malformedJson)).toThrow(BadRequestException);
  });

  it('throws BadRequestException when the shape is neither an array nor { tickets }', () => {
    expect(() => parser.parse(JSON.stringify({ foo: 'bar' }))).toThrow(BadRequestException);
  });

  it('returns an empty array for an empty JSON array', () => {
    expect(parser.parse('[]')).toEqual([]);
  });
});
