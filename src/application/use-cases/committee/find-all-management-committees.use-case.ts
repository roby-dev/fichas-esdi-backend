import { Inject, Injectable } from '@nestjs/common';
import type { CommitteeRepository } from 'src/domain/repositories/committee.repository';
import { COMMITTEE_REPOSITORY } from 'src/domain/constants/tokens';
import { CommitteeResponseDto } from 'src/application/dtos/committee/committee-response.dto';

@Injectable()
export class FindAllCommitteesUseCase {
  constructor(
    @Inject(COMMITTEE_REPOSITORY)
    private readonly committeeRepository: CommitteeRepository,
  ) {}

  async execute(limit = 10, offset = 0): Promise<CommitteeResponseDto[]> {
    const entities = await this.committeeRepository.findAll(limit, offset);
    return entities.map(CommitteeResponseDto.fromDomain);
  }
}
