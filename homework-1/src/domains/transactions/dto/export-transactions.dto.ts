import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';

export const EXPORT_FORMATS = ['csv'] as const;
export type ExportFormat = (typeof EXPORT_FORMATS)[number];

export class ExportTransactionsDto {
  @ApiPropertyOptional({
    description: 'Export format. Currently only "csv" is supported.',
    enum: EXPORT_FORMATS,
    default: 'csv',
  })
  @IsOptional()
  @IsIn(EXPORT_FORMATS, {
    message: `Format must be one of: ${EXPORT_FORMATS.join(', ')}`,
  })
  format?: ExportFormat;
}
