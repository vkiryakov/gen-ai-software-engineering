import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { ExportTransactionsDto } from './dto/export-transactions.dto';
import { FindTransactionsDto } from './dto/find-transactions.dto';
import type { Transaction } from './transaction.types';
import { TransactionsService } from './transactions.service';

@ApiTags('transactions')
@Controller('transactions')
export class TransactionsController {
  constructor(private readonly transactions: TransactionsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new transaction' })
  @ApiResponse({ status: 201, description: 'Transaction created' })
  @ApiResponse({ status: 400, description: 'Validation failed' })
  create(@Body() dto: CreateTransactionDto): Transaction {
    return this.transactions.create(dto);
  }

  @Get()
  @ApiOperation({
    summary:
      'List transactions, optionally filtered by account, type, and/or date range.',
  })
  findAll(@Query() query: FindTransactionsDto): Transaction[] {
    return this.transactions.find(query);
  }

  @Get('export')
  @ApiOperation({
    summary: 'Export all transactions as a CSV download.',
  })
  @ApiResponse({
    status: 200,
    description: 'CSV body. Defaults to "csv" when `format` is omitted.',
    content: { 'text/csv': {} },
  })
  @Header('Content-Type', 'text/csv; charset=utf-8')
  @Header('Content-Disposition', 'attachment; filename="transactions.csv"')
  exportTransactions(@Query() _query: ExportTransactionsDto): string {
    return this.transactions.exportCsv();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a transaction by ID' })
  @ApiResponse({ status: 200, description: 'Transaction found' })
  @ApiResponse({ status: 404, description: 'Transaction not found' })
  findOne(@Param('id') id: string): Transaction {
    return this.transactions.findById(id);
  }
}
