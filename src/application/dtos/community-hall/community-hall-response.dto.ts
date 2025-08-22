import { ApiProperty } from '@nestjs/swagger';
import { CommunityHall } from 'src/domain/entities/community-hall.entity';
import { ManagementCommitteeResponseDto } from '../management-committee/management-committee-response.dto';

export class CommunityHallResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  localId: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  managementCommitteeId: string;

  @ApiProperty()
  managementCommittee: ManagementCommitteeResponseDto | undefined;

  static fromDomain(entity: CommunityHall): CommunityHallResponseDto {
    return {
      id: entity.id!,
      localId: entity.localId,
      name: entity.name,
      managementCommitteeId: entity.managementCommitteeId,
      managementCommittee: entity.managementCommittee
        ? ManagementCommitteeResponseDto.fromDomain(entity.managementCommittee)
        : undefined,
    };
  }
}
