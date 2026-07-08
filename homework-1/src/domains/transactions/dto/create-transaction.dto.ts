import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { ISO_4217_CURRENCIES } from '../../../common/iso-4217-currencies';
import { TransactionStatus, TransactionType } from '../transaction.types';

const ACCOUNT_NUMBER_PATTERN = /^ACC-[A-Z0-9]{5}$/;
const ACCOUNT_NUMBER_MESSAGE =
  'Account number must follow format ACC-XXXXX (where X is alphanumeric)';

export class CreateTransactionDto {
  @ApiPropertyOptional({
    description:
      'Source account in ACC-XXXXX format. Required for "withdrawal" and "transfer"; ignored for "deposit".',
    example: 'ACC-00001',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : (value as unknown),
  )
  @Matches(ACCOUNT_NUMBER_PATTERN, { message: ACCOUNT_NUMBER_MESSAGE })
  fromAccount?: string;

  @ApiPropertyOptional({
    description:
      'Destination account in ACC-XXXXX format. Required for "deposit" and "transfer"; ignored for "withdrawal".',
    example: 'ACC-00002',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : (value as unknown),
  )
  @Matches(ACCOUNT_NUMBER_PATTERN, { message: ACCOUNT_NUMBER_MESSAGE })
  toAccount?: string;

  @ApiProperty({
    description: 'Transaction amount; positive, up to 2 decimal places.',
    example: 100.5,
  })
  @IsNumber(
    { maxDecimalPlaces: 2 },
    { message: 'Amount must be a number with at most 2 decimal places' },
  )
  @IsPositive({ message: 'Amount must be a positive number' })
  amount!: number;

  @ApiProperty({
    description: 'ISO 4217 currency code (e.g. USD, EUR, GBP, JPY).',
    example: 'USD',
  })
  @IsString({ message: 'Currency must be a string' })
  @Transform(({ value }) =>
    typeof value === 'string' ? value.trim().toUpperCase() : (value as unknown),
  )
  @IsIn(ISO_4217_CURRENCIES, { message: 'Invalid currency code' })
  currency!: string;

  @ApiProperty({ enum: TransactionType, description: 'Transaction type.' })
  @IsEnum(TransactionType, {
    message: `Transaction type must be one of: ${Object.values(TransactionType).join(', ')}`,
  })
  type!: TransactionType;

  @ApiPropertyOptional({
    enum: TransactionStatus,
    description: 'Initial status. Defaults to "completed".',
    default: TransactionStatus.Completed,
  })
  @IsOptional()
  @IsEnum(TransactionStatus, {
    message: `Status must be one of: ${Object.values(TransactionStatus).join(', ')}`,
  })
  status?: TransactionStatus;
}
