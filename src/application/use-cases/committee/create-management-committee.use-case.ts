import { Inject, Injectable } from '@nestjs/common';
import { CommitteeResponseDto } from 'src/application/dtos/committee/committee-response.dto';
import { CreateCommitteeDto } from 'src/application/dtos/committee/create-committee.dto';
import { COMMITTEE_REPOSITORY } from 'src/domain/constants/tokens';
import { Committee } from 'src/domain/entities/committe.entity';
import type { CommitteeRepository } from 'src/domain/repositories/committee.repository';

@Injectable()
export class CreateCommitteeUseCase {
  constructor(
    @Inject(COMMITTEE_REPOSITORY)
    private readonly committeeRepository: CommitteeRepository,
  ) {}

  async execute(
    createCommitteeDto: CreateCommitteeDto,
  ): Promise<CommitteeResponseDto> {
    const entity = Committee.create(
      createCommitteeDto.committeeId,
      createCommitteeDto.name,
    );
    const saved = await this.committeeRepository.save(entity);
    return CommitteeResponseDto.fromDomain(saved);
  }
}
