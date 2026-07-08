import { resolveImportFormat } from './import-format';

describe('resolveImportFormat', () => {
  it('honors a valid explicit override above everything', () => {
    expect(resolveImportFormat('data.json', 'application/json', 'xml')).toBe('xml');
  });

  it('returns undefined for an invalid override instead of falling through', () => {
    expect(resolveImportFormat('data.csv', 'text/csv', 'yaml')).toBeUndefined();
  });

  it('resolves by file extension', () => {
    expect(resolveImportFormat('tickets.CSV', 'application/octet-stream')).toBe('csv');
    expect(resolveImportFormat('tickets.xml', 'application/octet-stream')).toBe('xml');
  });

  it('falls back to MIME type when the extension is unknown', () => {
    expect(resolveImportFormat('upload.tmp', 'application/json')).toBe('json');
    expect(resolveImportFormat('upload.tmp', 'text/xml')).toBe('xml');
  });

  it('returns undefined when nothing matches', () => {
    expect(resolveImportFormat('upload.tmp', 'application/pdf')).toBeUndefined();
  });
});
