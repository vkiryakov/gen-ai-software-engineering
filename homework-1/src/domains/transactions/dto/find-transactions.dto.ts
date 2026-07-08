import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsISO8601,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { TransactionType } from '../transaction.types';

const ACCOUNT_NUMBER_PATTERN = /^ACC-[A-Z0-9]{5}$/;
const ACCOUNT_NUMBER_MESSAGE =
  'Account number must follow format ACC-XXXXX (where X is alphanumeric)';

export class FindTransactionsDto {
  @ApiPropertyOptional({
    description:
      'Filter by account. Matches transactions where the account appears as either source or destination.',
    example: 'ACC-00001',
  })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : (value as unknown),
  )
  @Matches(ACCOUNT_NUMBER_PATTERN, { message: ACCOUNT_NUMBER_MESSAGE })
  accountId?: string;

  @ApiPropertyOptional({
    enum: TransactionType,
    description: 'Filter by transaction type.',
  })
  @IsOptional()
  @IsEnum(TransactionType, {
    message: `Transaction type must be one of: ${Object.values(TransactionType).join(', ')}`,
  })
  type?: TransactionType;

  @ApiPropertyOptional({
    description:
      'Inclusive lower bound. Accepts a date (YYYY-MM-DD) or full ISO 8601 datetime.',
    example: '2024-01-01',
  })
  @IsOptional()
  @IsISO8601(
    { strict: true },
    { message: '"from" must be a YYYY-MM-DD date or ISO 8601 datetime' },
  )
  from?: string;

  @ApiPropertyOptional({
    description:
      'Inclusive upper bound. Accepts a date (YYYY-MM-DD) or full ISO 8601 datetime; bare dates extend to end-of-day UTC.',
    example: '2024-01-31',
  })
  @IsOptional()
  @IsISO8601(
    { strict: true },
    { message: '"to" must be a YYYY-MM-DD date or ISO 8601 datetime' },
  )
  to?: string;
}
