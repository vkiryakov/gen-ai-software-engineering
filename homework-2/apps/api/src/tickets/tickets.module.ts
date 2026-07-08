import { Module } from '@nestjs/common';
import { ImportModule } from '../import/import.module';
import { ClassificationService } from './classification.service';
import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';

@Module({
  imports: [ImportModule],
  controllers: [TicketsController],
  providers: [TicketsService, ClassificationService],
  exports: [TicketsService, ClassificationService],
})
export class TicketsModule {}
