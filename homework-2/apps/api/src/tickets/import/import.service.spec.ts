import { ImportService } from './import.service';
import { CsvParserService } from './csv-parser.service';
import { JsonParserService } from './json-parser.service';
import { XmlParserService } from './xml-parser.service';
import { TicketsService } from '../tickets.service';
import { TicketsRepository } from '../tickets.repository';
import { ClassificationService } from '../classification/classification.service';

function makeFile(name: string, content: string): Express.Multer.File {
  return {
    originalname: name,
    buffer: Buffer.from(content, 'utf-8'),
  } as Express.Multer.File;
}

describe('ImportService', () => {
  let service: ImportService;
  let ticketsService: TicketsService;

  beforeEach(() => {
    ticketsService = new TicketsService(new TicketsRepository(), new ClassificationService());
    service = new ImportService(
      new CsvParserService(),
      new JsonParserService(),
      new XmlParserService(),
      ticketsService,
      new ClassificationService(),
    );
  });

  it('throws BadRequestException when no file is provided', () => {
    expect(() => service.importFile(undefined)).toThrow('No file uploaded');
  });

  it('throws BadRequestException for an unsupported extension', () => {
    expect(() => service.importFile(makeFile('data.txt', 'irrelevant'))).toThrow('Unsupported file type');
  });

  it('imports a valid CSV and reports the correct summary counts', () => {
    const csv = [
      'subject,customer_name,customer_email,description',
      'Cannot log in,Alice Smith,alice@example.com,I forgot my password and cannot log in at all.',
      'App crash,Bob Jones,bob@example.com,The app crashes every single time I try to open it on my phone.',
    ].join('\n');
    const summary = service.importFile(makeFile('tickets.csv', csv));
    expect(summary.imported_count).toBe(2);
    expect(summary.failed_count).toBe(0);
    expect(summary.total_count).toBe(2);
    expect(ticketsService.list({})).toHaveLength(2);
  });

  it('reports per-row errors for invalid rows without failing the whole import', () => {
    const csv = [
      'subject,customer_name,customer_email,description',
      'Cannot log in,Alice Smith,alice@example.com,I forgot my password and cannot log in at all.',
      ',Bob Jones,not-an-email,short',
    ].join('\n');
    const summary = service.importFile(makeFile('tickets.csv', csv));
    expect(summary.imported_count).toBe(1);
    expect(summary.failed_count).toBe(1);
    expect(summary.errors[0].row).toBe(3);
  });

  it('auto-classifies rows that omit category/priority', () => {
    const json = JSON.stringify([
      {
        subject: "Can't access my account",
        customer_name: 'Dana Okoro',
        customer_email: 'dana@example.com',
        description: 'I cannot log in at all, this is critical and urgent for my whole team.',
      },
    ]);
    service.importFile(makeFile('tickets.json', json));
    const [ticket] = ticketsService.list({});
    expect(ticket.category).toBe('account_access');
    expect(ticket.priority).toBe('urgent');
  });

  it('keeps explicit category/priority from the row instead of classifying', () => {
    const json = JSON.stringify([
      {
        subject: 'Random topic',
        customer_name: 'Wei Zhang',
        customer_email: 'wei@example.com',
        description: 'This text has no strong keyword signal in it at all for classification.',
        category: 'feature_request',
        priority: 'low',
      },
    ]);
    service.importFile(makeFile('tickets.json', json));
    const [ticket] = ticketsService.list({});
    expect(ticket.category).toBe('feature_request');
    expect(ticket.priority).toBe('low');
  });

  it('imports a valid XML file', () => {
    const xml =
      '<tickets><ticket><subject>API 500s</subject><customer_name>Lena F</customer_name>' +
      '<customer_email>lena@example.com</customer_email>' +
      '<description>Roughly 1 in 5 calls return a 500 with no body since this morning.</description></ticket></tickets>';
    const summary = service.importFile(makeFile('tickets.xml', xml));
    expect(summary.imported_count).toBe(1);
  });
});
