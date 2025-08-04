import { ApiProperty } from '@nestjs/swagger';
import { Child } from 'src/domain/entities/child.entity';

export class ChildResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() documentNumber: string;
  @ApiProperty() firstName: string;
  @ApiProperty() lastName: string;
  @ApiProperty() birthday: Date;
  @ApiProperty() admissionDate: Date;
  @ApiProperty() communityHallId: string;
  @ApiProperty() communityHallName?: string;

  @ApiProperty() admissionValidFrom: Date;
  @ApiProperty() admissionValidUntil: Date;
  @ApiProperty() graduationDate: Date;
  @ApiProperty() isCurrentlyAdmitted: boolean;
  @ApiProperty() isGraduated: boolean;

  static fromDomain(entity: Child): ChildResponseDto {
    const dto = new ChildResponseDto();
    const primitives = entity.toPrimitives();

    dto.id = primitives.id!;
    dto.documentNumber = primitives.documentNumber;
    dto.firstName = primitives.firstName;
    dto.lastName = primitives.lastName;
    dto.birthday = primitives.birthday;
    dto.admissionDate = primitives.admissionDate;
    dto.communityHallId = primitives.communityHallId;
    dto.communityHallName = primitives.communityHall?.name;

    dto.admissionValidFrom = entity.admissionValidFrom;
    dto.admissionValidUntil = entity.admissionValidUntil;
    dto.graduationDate = entity.graduationDate;
    dto.isCurrentlyAdmitted = entity.isCurrentlyAdmitted;
    dto.isGraduated = entity.isGraduated;

    return dto;
  }
}
