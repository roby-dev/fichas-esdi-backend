import { ApiProperty } from '@nestjs/swagger';
import { Child } from 'src/domain/entities/child.entity';
import { CommunityHallResponseDto } from '../community-hall/community-hall-response.dto';

export class ChildResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() documentNumber: string;
  @ApiProperty() firstName: string;
  @ApiProperty() lastName: string;
  @ApiProperty() birthday: Date;
  @ApiProperty() admissionDate: Date;
  @ApiProperty() communityHallId: string;

  @ApiProperty() admissionValidFrom: Date;
  @ApiProperty() admissionValidUntil: Date;
  @ApiProperty() graduationDate: Date;
  @ApiProperty() isCurrentlyAdmitted: boolean;
  @ApiProperty() isGraduated: boolean;

  @ApiProperty() communityHall: CommunityHallResponseDto | undefined;

  static fromDomain(entity: Child): ChildResponseDto {
    const dto = new ChildResponseDto();
    const primitives = entity.toPrimitives();

    return {
      id: primitives.id!,
      documentNumber: primitives.documentNumber,
      firstName: primitives.firstName,
      lastName: primitives.lastName,
      birthday: primitives.birthday,
      admissionDate: primitives.admissionDate,
      communityHallId: primitives.communityHallId,
      admissionValidFrom: entity.admissionValidFrom,
      admissionValidUntil: entity.admissionValidUntil,
      graduationDate: entity.graduationDate,
      isCurrentlyAdmitted: entity.isCurrentlyAdmitted,
      isGraduated: entity.isGraduated,
      communityHall: entity.communityHall
        ? CommunityHallResponseDto.fromDomain(entity.communityHall)
        : undefined,
    };
  }
}
