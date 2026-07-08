import { Module } from '@nestjs/common';
import { CsvParserService } from './csv-parser.service';
import { JsonParserService } from './json-parser.service';
import { XmlParserService } from './xml-parser.service';

@Module({
  providers: [CsvParserService, JsonParserService, XmlParserService],
  exports: [CsvParserService, JsonParserService, XmlParserService],
})
export class ImportModule {}
