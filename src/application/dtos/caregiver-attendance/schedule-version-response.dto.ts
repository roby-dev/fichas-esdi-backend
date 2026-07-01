import { ApiProperty } from '@nestjs/swagger';
import { CaregiverScheduleVersion } from 'src/domain/entities/caregiver-schedule-version.entity';

export class ScheduleBlockResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() name: string;
  @ApiProperty() entryTime: string;
  @ApiProperty({ nullable: true }) exitTime: string | null;
  @ApiProperty() exitRequired: boolean;
  @ApiProperty() toleranceMinutes: number;
  @ApiProperty() markingWindowMinutes: number;
}

export class DayRuleResponseDto {
  @ApiProperty() dayOfWeek: number;
  @ApiProperty() isWorkingDay: boolean;
  @ApiProperty({ type: [String] }) blockIds: string[];
}

export class SpecialDayResponseDto {
  @ApiProperty() localDate: string;
  @ApiProperty() isWorkingDay: boolean;
  @ApiProperty({ type: [String] }) blockIds: string[];
}

export class ScheduleVersionResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() communityHallId: string;
  @ApiProperty() name: string;
  @ApiProperty() validFrom: Date;
  @ApiProperty({ nullable: true }) validTo: Date | null;
  @ApiProperty({ type: [ScheduleBlockResponseDto] })
  blocks: ScheduleBlockResponseDto[];
  @ApiProperty({ type: [DayRuleResponseDto] }) dayRules: DayRuleResponseDto[];
  @ApiProperty({ type: [SpecialDayResponseDto] })
  specialDays: SpecialDayResponseDto[];

  static fromDomain(
    entity: CaregiverScheduleVersion,
  ): ScheduleVersionResponseDto {
    const p = entity.toPrimitives();
    return {
      id: p.id!,
      communityHallId: p.communityHallId,
      name: p.name,
      validFrom: p.validFrom,
      validTo: p.validTo ?? null,
      blocks: p.blocks.map((b) => ({
        id: b.id,
        name: b.name,
        entryTime: b.entryTime,
        exitTime: b.exitTime ?? null,
        exitRequired: b.exitRequired,
        toleranceMinutes: b.toleranceMinutes,
        markingWindowMinutes: b.markingWindowMinutes,
      })),
      dayRules: p.dayRules,
      specialDays: p.specialDays ?? [],
    };
  }
}
