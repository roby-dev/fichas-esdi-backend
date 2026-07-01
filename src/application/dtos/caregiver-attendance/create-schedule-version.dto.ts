import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export class ScheduleBlockDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  id?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '08:00' })
  @IsString()
  entryTime: string;

  @ApiPropertyOptional({ example: '12:00' })
  @IsOptional()
  @IsString()
  exitTime?: string;

  @ApiProperty({ default: false })
  @IsBoolean()
  exitRequired: boolean;

  @ApiProperty({ default: 10 })
  @IsNumber()
  toleranceMinutes: number;

  @ApiProperty({ default: 30 })
  @IsNumber()
  markingWindowMinutes: number;
}

export class DayRuleDto {
  @ApiProperty({ minimum: 0, maximum: 6 })
  @IsNumber()
  dayOfWeek: number;

  @ApiProperty()
  @IsBoolean()
  isWorkingDay: boolean;

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  blockIds: string[];
}

export class SpecialDayDto {
  @ApiProperty({ example: '2025-01-06' })
  @IsString()
  localDate: string;

  @ApiProperty()
  @IsBoolean()
  isWorkingDay: boolean;

  @ApiProperty({ type: [String] })
  @IsArray()
  @IsString({ each: true })
  blockIds: string[];
}

export class CreateScheduleVersionDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  communityHallId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: '2025-01-01' })
  @IsDateString()
  validFrom: string;

  @ApiPropertyOptional({ example: '2025-12-31' })
  @IsOptional()
  @IsDateString()
  validTo?: string;

  @ApiProperty({ type: [ScheduleBlockDto] })
  @IsArray()
  @IsObject({ each: true })
  blocks: ScheduleBlockDto[];

  @ApiProperty({ type: [DayRuleDto] })
  @IsArray()
  @IsObject({ each: true })
  dayRules: DayRuleDto[];

  @ApiPropertyOptional({ type: [SpecialDayDto] })
  @IsOptional()
  @IsArray()
  @IsObject({ each: true })
  specialDays?: SpecialDayDto[];
}
