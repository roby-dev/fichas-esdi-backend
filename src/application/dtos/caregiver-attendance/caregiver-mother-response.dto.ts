import { ApiProperty } from '@nestjs/swagger';
import { CaregiverMother } from 'src/domain/entities/caregiver-mother.entity';

export class CaregiverMotherResponseDto {
  @ApiProperty() id: string;
  @ApiProperty() documentType: string;
  @ApiProperty() documentNumber: string;
  @ApiProperty() firstName: string;
  @ApiProperty() lastName: string;
  @ApiProperty() fullName: string;
  @ApiProperty({ nullable: true }) phone: string | null;
  @ApiProperty() startDate: Date;
  @ApiProperty({ nullable: true }) endDate: Date | null;
  @ApiProperty() status: string;

  static fromDomain(entity: CaregiverMother): CaregiverMotherResponseDto {
    const p = entity.toPrimitives();
    return {
      id: p.id!,
      documentType: p.documentType,
      documentNumber: p.documentNumber,
      firstName: p.firstName,
      lastName: p.lastName,
      fullName: p.fullName ?? '',
      phone: p.phone ?? null,
      startDate: p.startDate,
      endDate: p.endDate ?? null,
      status: p.status,
    };
  }
}
