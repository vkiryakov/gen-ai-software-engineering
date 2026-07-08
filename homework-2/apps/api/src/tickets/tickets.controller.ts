import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  createTicketSchema,
  listTicketsQuerySchema,
  updateTicketSchema,
  type ClassificationResult,
  type CreateTicketInput,
  type ImportFormat,
  type ImportSummary,
  type ListTicketsQuery,
  type Ticket,
  type UpdateTicketInput,
} from '@repo/contracts';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { CsvParserService } from '../import/csv-parser.service';
import { ImportParseError } from '../import/import-parse.error';
import { resolveImportFormat } from '../import/import-format';
import { JsonParserService } from '../import/json-parser.service';
import { XmlParserService } from '../import/xml-parser.service';
import { TicketsService } from './tickets.service';

@Controller('tickets')
export class TicketsController {
  constructor(
    private readonly tickets: TicketsService,
    private readonly csvParser: CsvParserService,
    private readonly jsonParser: JsonParserService,
    private readonly xmlParser: XmlParserService,
  ) {}

  @Post()
  @HttpCode(201)
  create(@Body(new ZodValidationPipe(createTicketSchema)) dto: CreateTicketInput): Ticket {
    return this.tickets.create(dto);
  }

  @Post('import')
  @HttpCode(200)
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 1024 * 1024 } }))
  import(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Query('format') format?: string,
    @Query('auto_classify') autoClassify?: string,
  ): ImportSummary {
    if (!file || file.size === 0) {
      throw new BadRequestException('Upload a non-empty file in the "file" form field');
    }

    const resolved = resolveImportFormat(file.originalname, file.mimetype, format);
    if (!resolved) {
      throw new BadRequestException(
        'Cannot determine the file format — pass ?format=csv|json|xml or use a .csv/.json/.xml file',
      );
    }

    const parsers: Record<ImportFormat, { parse(content: string): unknown[] }> = {
      csv: this.csvParser,
      json: this.jsonParser,
      xml: this.xmlParser,
    };

    try {
      const rows = parsers[resolved].parse(file.buffer.toString('utf8'));
      return this.tickets.importRecords(rows, autoClassify === 'true');
    } catch (error) {
      if (error instanceof ImportParseError) throw new BadRequestException(error.message);
      throw error;
    }
  }

  @Get()
  findAll(
    @Query(new ZodValidationPipe(listTicketsQuerySchema)) query: ListTicketsQuery,
  ): Ticket[] {
    return this.tickets.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string): Ticket {
    return this.tickets.findOne(id);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(updateTicketSchema)) dto: UpdateTicketInput,
  ): Ticket {
    return this.tickets.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  remove(@Param('id') id: string): void {
    this.tickets.remove(id);
  }

  @Post(':id/auto-classify')
  @HttpCode(200)
  autoClassify(@Param('id') id: string): ClassificationResult {
    return this.tickets.autoClassify(id);
  }
}
