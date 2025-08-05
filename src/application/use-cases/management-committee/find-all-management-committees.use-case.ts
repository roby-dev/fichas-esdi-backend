import { Inject, Injectable } from '@nestjs/common';
import type { ManagementCommitteeRepository } from 'src/domain/repositories/management-committee.repository';
import { MANAGEMENT_COMMITTEE_REPOSITORY } from 'src/domain/constants/tokens';
import { ManagementCommitteeResponseDto } from 'src/application/dtos/management-committee/management-committee-response.dto';
import { RequestUserContext } from 'src/common/context/user-context.service';

@Injectable()
export class FindAllManagementCommitteesUseCase {
  constructor(
    @Inject(MANAGEMENT_COMMITTEE_REPOSITORY)
    private readonly managementCommitteeRepository: ManagementCommitteeRepository,
    private readonly userContext: RequestUserContext,
  ) {}

  async execute(
    limit = 10,
    offset = 0,
  ): Promise<ManagementCommitteeResponseDto[]> {
    const userId = this.userContext.getUserId();
    const entities = await this.managementCommitteeRepository.findAllByUserId(
      userId,
      limit,
      offset,
    );
    return entities.map(ManagementCommitteeResponseDto.fromDomain);
  }
}
