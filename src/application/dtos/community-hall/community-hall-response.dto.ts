import { ApiProperty } from '@nestjs/swagger';
import { CommunityHall } from 'src/domain/entities/community-hall.entity';

export class CommunityHallResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  managementCommitteeId: string;

  static fromDomain(entity: CommunityHall): CommunityHallResponseDto {
    return {
      id: entity.id!,
      name: entity.name,
      managementCommitteeId: entity.managementCommitteeId,
    };
  }
}
