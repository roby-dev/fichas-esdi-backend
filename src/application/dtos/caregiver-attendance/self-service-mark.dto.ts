import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';

export class SelfServiceMarkDto {
  @ApiPropertyOptional({ example: 'DNI' })
  @IsOptional()
  @IsString()
  documentType?: string;

  @ApiProperty({ example: '12345678' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 20)
  documentNumber: string;

  @ApiPropertyOptional({
    example: '2025-01-06',
    description:
      'Optional override for testing; defaults to current local date',
  })
  @IsOptional()
  @IsString()
  localDate?: string;

  @ApiPropertyOptional({
    example: '08:05',
    description:
      'Optional override for testing; defaults to current local time',
  })
  @IsOptional()
  @IsString()
  entryTime?: string;
}
