import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class AssistedMarkDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  caregiverId: string;

  @ApiProperty({ example: '2025-01-06' })
  @IsDateString()
  localDate: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  blockId: string;

  @ApiPropertyOptional({ example: '08:00' })
  @IsOptional()
  @IsString()
  entryTime?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  reason: string;
}
