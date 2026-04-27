import { Inject, Injectable } from '@nestjs/common';
import {
  COMMUNITY_HALL_REPOSITORY,
  MANAGEMENT_COMMITTEE_REPOSITORY,
} from 'src/domain/constants/tokens';
import type { CommunityHallRepository } from 'src/domain/repositories/community-hall.repository';
import type { ManagementCommitteeRepository } from 'src/domain/repositories/management-committee.repository';
import { ConflictException, NotFoundException } from 'src/domain/exceptions';
import { CommunityHall } from 'src/domain/entities/community-hall.entity';
import { CreateCommunityHallDto } from '../dtos/community-hall/create-community-hall.dto';
import { CommunityHallResponseDto } from '../dtos/community-hall/community-hall-response.dto';

@Injectable()
export class CommunityHallService {
  constructor(
    @Inject(COMMUNITY_HALL_REPOSITORY)
    private readonly repository: CommunityHallRepository,
    @Inject(MANAGEMENT_COMMITTEE_REPOSITORY)
    private readonly managementCommitteeRepository: ManagementCommitteeRepository,
  ) {}

  async create(dto: CreateCommunityHallDto): Promise<CommunityHallResponseDto> {
    const committee = await this.managementCommitteeRepository.findById(
      dto.managementCommitteeId,
    );
    if (!committee) {
      throw new NotFoundException(
        `No existe un comité con id ${dto.managementCommitteeId}`,
      );
    }

    const existing = await this.repository.findByNameAndCommitteeId(
      dto.name,
      dto.managementCommitteeId,
    );
    if (existing) {
      throw new ConflictException(
        'Ya existe un local comunal con ese nombre en el mismo comité',
      );
    }

    const entity = CommunityHall.create(
      dto.localId,
      dto.name,
      dto.managementCommitteeId,
      committee,
    );
    const saved = await this.repository.save(entity);
    return CommunityHallResponseDto.fromDomain(saved);
  }

  async findAll(limit = 10, offset = 0): Promise<CommunityHallResponseDto[]> {
    const halls = await this.repository.findAll(limit, offset);
    return halls.map(CommunityHallResponseDto.fromDomain);
  }

  async findById(id: string): Promise<CommunityHallResponseDto> {
    const entity = await this.repository.findById(id);
    if (!entity) {
      throw new NotFoundException(`No existe un local comunal con id ${id}`);
    }
    return CommunityHallResponseDto.fromDomain(entity);
  }

  async findAllByCommitteeId(
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
