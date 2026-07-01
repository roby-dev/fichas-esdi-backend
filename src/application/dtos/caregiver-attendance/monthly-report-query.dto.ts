import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBooleanString, IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class MonthlyReportQueryDto {
  @ApiProperty({ example: 2025 })
  @Type(() => Number)
  @IsInt()
  @Min(2000)
  year: number;

  @ApiProperty({ example: 1, minimum: 1, maximum: 12 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(12)
  month: number;

  @ApiPropertyOptional({
    example: 'false',
    description: 'Include expected caregivers without marks',
  })
  @IsOptional()
  @IsBooleanString()
  includeExpectedWithoutMarks?: string;
}
