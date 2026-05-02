import { ApiProperty } from '@nestjs/swagger';
import { CommunityHall } from 'src/domain/entities/community-hall.entity';
import { CommitteeResponseDto } from '../committee/committee-response.dto';

export class CommunityHallResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  localId: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  committeeRef: string;

  @ApiProperty({ required: false })
  committee?: CommitteeResponseDto;

  static fromDomain(entity: CommunityHall): CommunityHallResponseDto {
    return {
      id: entity.id!,
      localId: entity.localId,
      name: entity.name,
      committeeRef: entity.committeeRef,
      committee: entity.committee
        ? CommitteeResponseDto.fromDomain(entity.committee)
        : undefined,
    };
  }
}
