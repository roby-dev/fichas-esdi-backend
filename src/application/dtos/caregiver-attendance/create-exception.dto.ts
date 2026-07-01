import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateExceptionDto {
  @ApiProperty({ enum: ['hall', 'caregiver'] })
  @IsString()
  @IsIn(['hall', 'caregiver'])
  scope: 'hall' | 'caregiver';

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  communityHallId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  caregiverId?: string;

  @ApiProperty({ example: '2025-01-06' })
  @IsDateString()
  localDate: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  blockId?: string;

  @ApiProperty({ enum: ['holiday', 'day_off', 'permission', 'justification'] })
  @IsString()
  @IsIn(['holiday', 'day_off', 'permission', 'justification'])
  kind: 'holiday' | 'day_off' | 'permission' | 'justification';

  @ApiPropertyOptional({ enum: ['accepted', 'pending'], default: 'accepted' })
  @IsOptional()
  @IsString()
  @IsIn(['accepted', 'pending'])
  status?: 'accepted' | 'pending';

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  reason: string;
}
