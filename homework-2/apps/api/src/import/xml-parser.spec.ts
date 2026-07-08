import { ImportParseError } from './import-parse.error';
import { XmlParserService } from './xml-parser.service';

const wrap = (inner: string) => `<?xml version="1.0" encoding="UTF-8"?><tickets>${inner}</tickets>`;

const TICKET = `<ticket>
  <customer_id>cust-1</customer_id>
  <customer_email>ada@example.com</customer_email>
  <customer_name>Ada Lovelace</customer_name>
  <subject>Cannot log in</subject>
  <description>I forgot my password and cannot access my account.</description>
  <tags><tag>auth</tag><tag>login</tag></tags>
  <metadata><source>email</source><device_type>mobile</device_type></metadata>
</ticket>`;

describe('XmlParserService', () => {
  const parser = new XmlParserService();

  it('parses multiple tickets', () => {
    expect(parser.parse(wrap(TICKET + TICKET))).toHaveLength(2);
  });

  it('normalizes a single ticket to a one-element array', () => {
    const rows = parser.parse(wrap(TICKET)) as Array<Record<string, unknown>>;
    expect(rows).toHaveLength(1);
    expect(rows[0].customer_id).toBe('cust-1');
  });

  it('maps nested tags and metadata elements', () => {
    const rows = parser.parse(wrap(TICKET)) as Array<Record<string, unknown>>;
    expect(rows[0].tags).toEqual(['auth', 'login']);
    expect(rows[0].metadata).toEqual({ source: 'email', device_type: 'mobile' });
  });

  it('normalizes a single <tag> child to a one-element array', () => {
    const single = TICKET.replace('<tags><tag>auth</tag><tag>login</tag></tags>', '<tags><tag>solo</tag></tags>');
    const rows = parser.parse(wrap(single)) as Array<Record<string, unknown>>;
    expect(rows[0].tags).toEqual(['solo']);
  });

  it('throws ImportParseError on malformed XML', () => {
    expect(() => parser.parse('<tickets><ticket><subject>Unclosed')).toThrow(ImportParseError);
  });

  it('throws ImportParseError when the tickets root is missing', () => {
    expect(() => parser.parse('<items><item>x</item></items>')).toThrow(ImportParseError);
  });

  it('throws ImportParseError on an empty file', () => {
    expect(() => parser.parse('')).toThrow(ImportParseError);
  });
});
