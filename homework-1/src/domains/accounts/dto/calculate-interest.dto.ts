import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNumber, IsPositive } from 'class-validator';

export class CalculateInterestDto {
  @ApiProperty({
    description: 'Annual interest rate as a decimal (e.g. 0.05 = 5%).',
    example: 0.05,
  })
  @Type(() => Number)
  @IsNumber({}, { message: 'Rate must be a number' })
  @IsPositive({ message: 'Rate must be a positive number' })
  rate!: number;

  @ApiProperty({
    description: 'Number of days the interest accrues over.',
    example: 30,
  })
  @Type(() => Number)
  @IsInt({ message: 'Days must be an integer' })
  @IsPositive({ message: 'Days must be a positive integer' })
  days!: number;
}
