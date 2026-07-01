import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
} from 'class-validator';

export class CreateCaregiverMotherDto {
  @ApiPropertyOptional({ example: 'DNI', description: 'Tipo de documento' })
  @IsOptional()
  @IsString()
  documentType?: string;

  @ApiProperty({ example: '12345678', description: 'Número de documento' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 20)
  documentNumber: string;

  @ApiProperty({ example: 'Maria', description: 'Nombres de la cuidadora' })
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @ApiProperty({
    example: 'Gonzalez',
    description: 'Apellidos de la cuidadora',
  })
  @IsString()
  @IsNotEmpty()
  lastName: string;

  @ApiPropertyOptional({ example: '999888777' })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: '2025-01-01', description: 'Fecha de inicio' })
  @IsDateString()
  startDate: string;

  @ApiPropertyOptional({ example: '2025-12-31', description: 'Fecha de baja' })
  @IsOptional()
  @IsDateString()
  endDate?: string;

  @ApiPropertyOptional({ example: 'active', enum: ['active', 'retired'] })
  @IsOptional()
  @IsString()
  status?: 'active' | 'retired';
}
