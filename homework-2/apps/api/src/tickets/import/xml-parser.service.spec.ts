import { readFileSync } from 'fs';
import { join } from 'path';
import { BadRequestException } from '@nestjs/common';
import { XmlParserService } from './xml-parser.service';

const fixturesDir = join(__dirname, '../../../test/fixtures');
const validXml = readFileSync(join(fixturesDir, 'tickets-valid.xml'), 'utf-8');
const malformedXml = readFileSync(join(fixturesDir, 'tickets-malformed.xml'), 'utf-8');

describe('XmlParserService', () => {
  const parser = new XmlParserService();

  it('parses multiple <ticket> elements with 1-based row numbers', () => {
    const rows = parser.parse(validXml);
    expect(rows).toHaveLength(2);
    expect(rows[0].row).toBe(1);
    expect(rows[0].data.subject).toBe('API returning 500 errors');
  });

  it('wraps a single <ticket> element into an array of length 1', () => {
    const xml = '<tickets><ticket><subject>Solo</subject></ticket></tickets>';
    const rows = parser.parse(xml);
    expect(rows).toHaveLength(1);
    expect(rows[0].data.subject).toBe('Solo');
  });

  it('throws BadRequestException for malformed XML', () => {
    expect(() => parser.parse(malformedXml)).toThrow(BadRequestException);
  });

  it('throws BadRequestException when the <tickets> root is missing', () => {
    expect(() => parser.parse('<other><ticket><subject>X</subject></ticket></other>')).toThrow(
      BadRequestException,
    );
  });

  it('returns an empty array for an empty <tickets> root', () => {
    expect(parser.parse('<tickets></tickets>')).toEqual([]);
  });
});
