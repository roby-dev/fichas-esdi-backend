import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsOptional, IsString, Length } from 'class-validator';

export class UpdateCaregiverMotherDto {
  @ApiPropertyOptional({ example: 'DNI' })
  @IsOptional()
  @IsString()
  documentType?: string;

  @ApiPropertyOptional({ example: '12345678' })
  @IsOptional()
  @IsString()
  @Length(1, 20)
  documentNumber?: string;

  @ApiPropertyOptional({ example: 'Maria' })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiPropertyOptional({ example: 'Gonzalez' })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiPropertyOptional({ example: '999888777' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional({ example: '2025-01-01' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ example: '2025-12-31' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ example: 'active', enum: ['active', 'retired'] })
  @IsOptional()
  @IsString()
  status?: 'active' | 'retired';
}
