import { Module } from '@nestjs/common';
import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';
import { TicketsRepository } from './tickets.repository';
import { ClassificationService } from './classification/classification.service';
import { CsvParserService } from './import/csv-parser.service';
import { JsonParserService } from './import/json-parser.service';
import { XmlParserService } from './import/xml-parser.service';
import { ImportService } from './import/import.service';

@Module({
  controllers: [TicketsController],
  providers: [
    TicketsService,
    TicketsRepository,
    ClassificationService,
    CsvParserService,
    JsonParserService,
    XmlParserService,
    ImportService,
  ],
})
export class TicketsModule {}
