import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { CreateTicketInput, CreateTicketInputSchema, UpdateTicketInput, UpdateTicketInputSchema } from '@repo/contracts';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { EnvelopeInterceptor } from '../common/envelope.interceptor';
import { ZodValidationPipe } from '../common/zod-validation.pipe';
import { TicketsService } from './tickets.service';
import { ImportService } from './import/import.service';

interface TicketsQuery {
  status?: string | string[];
  priority?: string | string[];
  category?: string | string[];
  assigned_to?: string;
  unassigned?: string;
  q?: string;
}

function toStringArray(value: string | string[] | undefined): string[] | undefined {
  if (value === undefined) return undefined;
  const joined = Array.isArray(value) ? value.join(',') : value;
  return joined.split(',').filter(Boolean);
}

@Controller('tickets')
@UseGuards(JwtAuthGuard)
@UseInterceptors(EnvelopeInterceptor)
export class TicketsController {
  constructor(
    protected readonly ticketsService: TicketsService,
    private readonly importService: ImportService,
  ) {}

  @Get()
  list(@Query() query: TicketsQuery) {
    return this.ticketsService.list({
      status: toStringArray(query.status),
      priority: toStringArray(query.priority),
      category: toStringArray(query.category),
      assigned_to: query.assigned_to,
      unassigned: query.unassigned === 'true',
      q: query.q,
    });
  }

  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.ticketsService.getById(id);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body(new ZodValidationPipe(CreateTicketInputSchema)) body: CreateTicketInput) {
    return this.ticketsService.create(body);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateTicketInputSchema)) body: UpdateTicketInput,
  ) {
    return this.ticketsService.update(id, body);
  }

  @Put(':id')
  replace(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateTicketInputSchema)) body: UpdateTicketInput,
  ) {
    return this.ticketsService.update(id, body);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    this.ticketsService.delete(id);
  }

  @Post(':id/classify')
  classify(@Param('id') id: string) {
    return this.ticketsService.classify(id);
  }

  @Post(':id/auto-classify')
  autoClassify(@Param('id') id: string) {
    return this.ticketsService.classify(id);
  }

  @Post('import')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file', { storage: memoryStorage() }))
  importTickets(@UploadedFile() file: Express.Multer.File) {
    return this.importService.importFile(file);
  }
}
