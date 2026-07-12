import { Module } from '@nestjs/common';
import { TicketsController } from './tickets.controller';
import { TicketsService } from './tickets.service';
import { TicketsRepository } from './tickets.repository';
import { ClassificationService } from './classification/classification.service';

@Module({
  controllers: [TicketsController],
  providers: [TicketsService, TicketsRepository, ClassificationService],
})
export class TicketsModule {}
