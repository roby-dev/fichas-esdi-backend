import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { CreateManagementCommitteeDto } from 'src/application/dtos/management-committee/create-management-committee.dto';
import { ManagementCommitteeResponseDto } from 'src/application/dtos/management-committee/management-committee-response.dto';
import { MANAGEMENT_COMMITTEE_REPOSITORY } from 'src/domain/constants/tokens';
import { ManagementCommittee } from 'src/domain/entities/management-committe.entity';
import type { ManagementCommitteeRepository } from 'src/domain/repositories/management-committee.repository';

@Injectable()
export class CreateManagementCommitteeUseCase {
  constructor(
    @Inject(MANAGEMENT_COMMITTEE_REPOSITORY)
    private readonly managementCommitteeRepository: ManagementCommitteeRepository,
  ) {}

  async execute(
    userId: string,
    createManagementCommitteeDto: CreateManagementCommitteeDto,
  ): Promise<ManagementCommitteeResponseDto> {
    const existing = await this.managementCommitteeRepository.findByName?.(
      createManagementCommitteeDto.name,
      userId,
    );

    if (existing) {
      throw new ConflictException(
        'Ya existe un comité con ese nombre para este usuario',
      );
    }

    const entity = ManagementCommittee.create(
      createManagementCommitteeDto.committeeId,
      createManagementCommitteeDto.name,
      userId,
    );
    const saved = await this.managementCommitteeRepository.save(entity);
    return ManagementCommitteeResponseDto.fromDomain(saved);
  }
}
