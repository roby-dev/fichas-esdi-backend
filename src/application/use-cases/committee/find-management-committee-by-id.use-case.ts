import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { COMMITTEE_REPOSITORY } from 'src/domain/constants/tokens';
import type { CommitteeRepository } from 'src/domain/repositories/committee.repository';
import { CommitteeResponseDto } from 'src/application/dtos/committee/committee-response.dto';

@Injectable()
export class FindCommitteeByIdUseCase {
  constructor(
    @Inject(COMMITTEE_REPOSITORY)
    private readonly committeeRepository: CommitteeRepository,
  ) {}

  async execute(id: string): Promise<CommitteeResponseDto> {
    const entity = await this.committeeRepository.findById(id);

    if (!entity) {
      throw new NotFoundException(`No existe un comité con id ${id}`);
    }

    return CommitteeResponseDto.fromDomain(entity);
  }
}
