import { Module } from '@nestjs/common';
import { ClassificationService } from './classification.service';
import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';

@Module({
  controllers: [TicketsController],
  providers: [TicketsService, ClassificationService],
  exports: [TicketsService, ClassificationService],
})
export class TicketsModule {}
