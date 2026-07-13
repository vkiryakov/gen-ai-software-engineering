import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateTicketInputSchema, ImportSummary } from '@repo/contracts';
import { TicketsService } from '../tickets.service';
import { ClassificationService } from '../classification/classification.service';
import { CsvParserService } from './csv-parser.service';
import { JsonParserService } from './json-parser.service';
import { XmlParserService } from './xml-parser.service';
import { ImportRow } from './types';

@Injectable()
export class ImportService {
  constructor(
    private readonly csvParser: CsvParserService,
    private readonly jsonParser: JsonParserService,
    private readonly xmlParser: XmlParserService,
    private readonly ticketsService: TicketsService,
    private readonly classificationService: ClassificationService,
  ) {}

  importFile(file: Express.Multer.File | undefined): ImportSummary {
    if (!file) {
      throw new BadRequestException('No file uploaded — expected multipart field "file".');
    }

    const ext = (/\.([a-z0-9]+)$/i.exec(file.originalname)?.[1] ?? '').toLowerCase();
    const text = file.buffer.toString('utf-8');

    let rows: ImportRow[];
    if (ext === 'csv') rows = this.csvParser.parse(text);
    else if (ext === 'json') rows = this.jsonParser.parse(text);
    else if (ext === 'xml') rows = this.xmlParser.parse(text);
    else throw new BadRequestException(`Unsupported file type ".${ext || 'unknown'}" — use .csv, .json or .xml.`);

    const errors: { row: number; message: string }[] = [];
    let imported = 0;

    for (const { row, data } of rows) {
      const candidate = {
        customer_email: data.customer_email,
        customer_name: data.customer_name,
        subject: data.subject,
        description: data.description || data.subject,
        category: data.category || undefined,
        priority: data.priority || undefined,
      };
      const parsed = CreateTicketInputSchema.safeParse(candidate);
      if (!parsed.success) {
        const message = parsed.error.issues
          .map((issue) => `${issue.path.join('.') || 'value'}: ${issue.message}`)
          .join(' ');
        errors.push({ row, message });
        continue;
      }

      const input = parsed.data;
      const needsClassification = !input.category || !input.priority;
      const classification = needsClassification
        ? this.classificationService.classify(input.subject, input.description)
        : undefined;

      this.ticketsService.create(
        { ...input, tags: [...(input.tags ?? []), 'imported'] },
        classification,
      );
      imported++;
    }

    return {
      imported_count: imported,
      failed_count: errors.length,
      total_count: rows.length,
      errors,
    };
  }
}
