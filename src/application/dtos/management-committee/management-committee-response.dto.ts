import { ApiProperty } from '@nestjs/swagger';
import { ManagementCommittee } from 'src/domain/entities/management-committe.entity';

export class ManagementCommitteeResponseDto {
  @ApiProperty({ example: '64ee123abcde4567f8901234' })
  id: string;

  @ApiProperty({ example: 'Comité de Gestión El Milagro' })
  name: string;

  static fromDomain(
    managementCommittee: ManagementCommittee,
  ): ManagementCommitteeResponseDto {
    const dto = new ManagementCommitteeResponseDto();
    dto.id = managementCommittee.id!;
    dto.name = managementCommittee.name;
    return dto;
  }
}
