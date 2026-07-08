import { CsvParserService } from './csv-parser.service';
import { ImportParseError } from './import-parse.error';

const HEADER =
  'customer_id,customer_email,customer_name,subject,description,tags,metadata_source,metadata_device_type';

describe('CsvParserService', () => {
  const parser = new CsvParserService();

  it('parses a valid CSV with a header row into records', () => {
    const csv = `${HEADER}\ncust-1,ada@example.com,Ada,Login broken,I cannot access my account at all.,,web_form,desktop`;
    const rows = parser.parse(csv);
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ customer_id: 'cust-1', subject: 'Login broken' });
  });

  it('supports quoted fields containing commas', () => {
    const csv = `${HEADER}\ncust-1,ada@example.com,Ada,"Login, 2FA broken","I cannot log in, reset, or use 2FA.",,web_form,desktop`;
    const rows = parser.parse(csv) as Array<Record<string, unknown>>;
    expect(rows[0].subject).toBe('Login, 2FA broken');
  });

  it('splits pipe-separated tags into an array', () => {
    const csv = `${HEADER}\ncust-1,ada@example.com,Ada,Slow app,The dashboard is very slow today.,perf|ui,web_form,desktop`;
    const rows = parser.parse(csv) as Array<Record<string, unknown>>;
    expect(rows[0].tags).toEqual(['perf', 'ui']);
  });

  it('nests metadata_* columns under metadata', () => {
    const csv = `${HEADER}\ncust-1,ada@example.com,Ada,Slow app,The dashboard is very slow today.,,email,mobile`;
    const rows = parser.parse(csv) as Array<Record<string, unknown>>;
    expect(rows[0].metadata).toEqual({ source: 'email', device_type: 'mobile' });
  });

  it('omits empty cells so optional fields stay undefined', () => {
    const csv = `${HEADER}\ncust-1,ada@example.com,Ada,Slow app,The dashboard is very slow today.,,,`;
    const rows = parser.parse(csv) as Array<Record<string, unknown>>;
    expect(rows[0]).not.toHaveProperty('tags');
    expect(rows[0]).not.toHaveProperty('metadata');
  });

  it('throws ImportParseError on an empty file', () => {
    expect(() => parser.parse('   ')).toThrow(ImportParseError);
  });

  it('throws ImportParseError on structurally malformed CSV (unclosed quote)', () => {
    const csv = `${HEADER}\n"cust-1,ada@example.com,Ada,Broken,Unclosed quote row`;
    expect(() => parser.parse(csv)).toThrow(ImportParseError);
  });

  it('throws ImportParseError when the header row is missing required columns', () => {
    expect(() => parser.parse('foo,bar\n1,2')).toThrow(ImportParseError);
  });

  it('does not fail the whole file when one row has a field-count mismatch', () => {
    const csv = `${HEADER}\ncust-1,ada@example.com,Ada,Slow app,The dashboard is very slow today.,,web_form,desktop\ncust-2,bob@example.com`;
    const rows = parser.parse(csv) as Array<Record<string, unknown>>;
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ customer_id: 'cust-1' });
    expect(rows[1]).toMatchObject({ customer_id: 'cust-2' });
    expect(rows[1]).not.toHaveProperty('subject');
  });
});
