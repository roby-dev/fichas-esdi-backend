import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsMongoId, IsOptional } from 'class-validator';

export class MarksQueryDto {
  @ApiProperty({ description: 'Caregiver ID' })
  @IsMongoId()
  caregiverId: string;

  @ApiPropertyOptional({ description: 'Local date (YYYY-MM-DD). When omitted, returns all marks for the caregiver.' })
  @IsOptional()
  @IsDateString()
  localDate?: string;
}
