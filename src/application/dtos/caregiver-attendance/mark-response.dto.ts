import { ApiProperty } from '@nestjs/swagger';
import { CaregiverAttendanceRecord } from 'src/domain/entities/caregiver-attendance-record.entity';

export class MarkResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() caregiverId: string;
  @ApiProperty() communityHallId: string;
  @ApiProperty() localDate: string;
  @ApiProperty() blockId: string;
  @ApiProperty() markKind: string;
  @ApiProperty({ nullable: true }) entryTime: string | null;
  @ApiProperty() source: string;
  @ApiProperty({ nullable: true }) reason: string | null;
  @ApiProperty() isVoided: boolean;

  static fromDomain(entity: CaregiverAttendanceRecord): MarkResponseDto {
    const p = entity.toPrimitives();
    return {
      id: p.id!,
      caregiverId: p.caregiverId,
      communityHallId: p.communityHallId,
      localDate: p.localDate,
      blockId: p.blockId,
      markKind: p.markKind,
      entryTime: p.entryTime ?? null,
      source: p.source,
      reason: p.reason ?? null,
      isVoided: p.isVoided,
    };
  }
}
