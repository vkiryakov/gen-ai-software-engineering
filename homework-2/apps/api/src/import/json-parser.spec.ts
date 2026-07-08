import { ImportParseError } from './import-parse.error';
import { JsonParserService } from './json-parser.service';

describe('JsonParserService', () => {
  const parser = new JsonParserService();

  it('parses a bare array of records', () => {
    expect(parser.parse('[{"customer_id":"c1"},{"customer_id":"c2"}]')).toHaveLength(2);
  });

  it('parses a { records: [...] } envelope', () => {
    expect(parser.parse('{"records":[{"customer_id":"c1"}]}')).toHaveLength(1);
  });

  it('throws ImportParseError on malformed JSON', () => {
    expect(() => parser.parse('{"records": [oops')).toThrow(ImportParseError);
  });

  it('throws ImportParseError when JSON is neither array nor envelope', () => {
    expect(() => parser.parse('{"tickets": 5}')).toThrow(ImportParseError);
  });

  it('throws ImportParseError on an empty file', () => {
    expect(() => parser.parse('')).toThrow(ImportParseError);
  });
});
