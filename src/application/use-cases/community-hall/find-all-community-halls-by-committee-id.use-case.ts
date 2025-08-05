import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import {
  COMMUNITY_HALL_REPOSITORY,
  MANAGEMENT_COMMITTEE_REPOSITORY,
} from 'src/domain/constants/tokens';
import type { CommunityHallRepository } from 'src/domain/repositories/community-hall.repository';
import type { ManagementCommitteeRepository } from 'src/domain/repositories/management-committee.repository';
import { CommunityHallResponseDto } from 'src/application/dtos/community-hall/community-hall-response.dto';

@Injectable()
export class FindAllCommunityHallsByCommitteeIdUseCase {
  constructor(
    @Inject(COMMUNITY_HALL_REPOSITORY)
    private readonly repository: CommunityHallRepository,
    @Inject(MANAGEMENT_COMMITTEE_REPOSITORY)
    private readonly managementCommitteeRepository: ManagementCommitteeRepository,
  ) {}

  async execute(
    committeeId: string,
    limit = 10,
    offset = 0,
  ): Promise<CommunityHallResponseDto[]> {
    const committee =
      await this.managementCommitteeRepository.findById(committeeId);
    if (!committee) {
      throw new NotFoundException(`No existe un comité con id ${committeeId}`);
    }

    const halls = await this.repository.findAllByCommitteeId(
      committeeId,
      limit,
      offset,
    );
    return halls.map(CommunityHallResponseDto.fromDomain);
  }
}
