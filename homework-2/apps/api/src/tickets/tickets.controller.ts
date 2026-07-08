import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  createTicketSchema,
  listTicketsQuerySchema,
  updateTicketSchema,
  type ClassificationResult,
  type CreateTicketInput,
  type ImportSummary,
  type ListTicketsQuery,
  type Ticket,
  type UpdateTicketInput,
} from '@repo/contracts';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { TicketsService } from './tickets.service';

@Controller('tickets')
export class TicketsController {
  constructor(private readonly tickets: TicketsService) {}

  @Post()
  @HttpCode(201)
  create(@Body(new ZodValidationPipe(createTicketSchema)) dto: CreateTicketInput): Ticket {
    return this.tickets.create(dto);
  }

  @Post('import')
  @HttpCode(200)
  import(@Body() body: { records?: unknown[] }): ImportSummary {
    return this.tickets.importJson(Array.isArray(body?.records) ? body.records : []);
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
