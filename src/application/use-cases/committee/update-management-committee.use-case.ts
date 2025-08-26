import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CommitteeResponseDto } from 'src/application/dtos/committee/committee-response.dto';
import { CreateUpdateCommitteeDto } from 'src/application/dtos/committee/create-update-committee.dto';
import { COMMITTEE_REPOSITORY } from 'src/domain/constants/tokens';
import { Committee } from 'src/domain/entities/committe.entity';
import type { CommitteeRepository } from 'src/domain/repositories/committee.repository';

@Injectable()
export class UpdateCommitteeUseCase {
  constructor(
    @Inject(COMMITTEE_REPOSITORY)
    private readonly committeeRepository: CommitteeRepository,
  ) {}

  async execute(
    id: string,
    updateCommitteeDto: CreateUpdateCommitteeDto,
  ): Promise<CommitteeResponseDto> {
    const existing = await this.committeeRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`No se encontró un comité con el ID ${id}`);
    }

    const update = new Committee(
      updateCommitteeDto.committeeId,
      updateCommitteeDto.name,
      existing.id,
    );

    const saved = await this.committeeRepository.update(update);
    return CommitteeResponseDto.fromDomain(saved);
  }
}
