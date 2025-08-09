import { ApiProperty } from '@nestjs/swagger';
import { AlertChild } from 'src/domain/entities/alert-child.entity';
import type { AlertSignalInterface } from 'src/domain/entities/alert-signal.entity';

export class AlertChildResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  documentNumber: string;

  @ApiProperty()
  fullName: string;

  @ApiProperty()
  gender: string;

  @ApiProperty()
  childCode: string;

  @ApiProperty({ type: String, format: 'date-time' })
  admissionDate: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  birthday: Date;

  @ApiProperty()
  managementCommitteName: string;

  @ApiProperty()
  managementCommitteCode: string;

  @ApiProperty()
  communityHallName: string;

  @ApiProperty()
  communityHallId: string;

  @ApiProperty()
  userId: string;

  @ApiProperty()
  ageInMonths: number;

  @ApiProperty()
  activeAlertSignal: string;

  @ApiProperty()
  alertSignalSchedule: string;

  static fromDomain(entity: AlertChild): AlertChildResponseDto {
    return {
      id: entity.id!,
      documentNumber: entity.documentNumber,
      fullName: entity.fullName,
      gender: entity.gender,
      childCode: entity.childCode,
      admissionDate: entity.admissionDate,
      birthday: entity.birthday,
      managementCommitteName: entity.managementCommitteName,
      communityHallName: entity.communityHallName,
      managementCommitteCode: entity.managementCommitteCode,
      communityHallId: entity.communityHallId,
      userId: entity.userId,
      ageInMonths: entity.ageInMonths,
      activeAlertSignal: entity.activeAlertSignal,
      alertSignalSchedule: entity.alertSignalSchedule
    };
  }
}
