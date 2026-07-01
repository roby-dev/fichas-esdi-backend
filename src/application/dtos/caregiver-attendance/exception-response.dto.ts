import { ApiProperty } from '@nestjs/swagger';
import { CaregiverAttendanceException } from 'src/domain/entities/caregiver-attendance-exception.entity';

export class ExceptionResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() scope: string;
  @ApiProperty({ nullable: true }) communityHallId: string | null;
  @ApiProperty({ nullable: true }) caregiverId: string | null;
  @ApiProperty() localDate: string;
  @ApiProperty({ nullable: true }) blockId: string | null;
  @ApiProperty() kind: string;
  @ApiProperty() status: string;
  @ApiProperty() reason: string;

  static fromDomain(
    entity: CaregiverAttendanceException,
  ): ExceptionResponseDto {
    const p = entity.toPrimitives();
    return {
      id: p.id!,
      scope: p.scope,
      communityHallId: p.communityHallId ?? null,
      caregiverId: p.caregiverId ?? null,
      localDate: p.localDate,
      blockId: p.blockId ?? null,
      kind: p.kind,
      status: p.status,
      reason: p.reason,
    };
  }
}
