import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConflictException, NotFoundException } from 'src/domain/exceptions';
import { MANAGEMENT_COMMITTEE_REPOSITORY } from 'src/domain/constants/tokens';
import { ManagementCommittee } from 'src/domain/entities/management-committee.entity';
import type { ManagementCommitteeRepository } from 'src/domain/repositories/management-committee.repository';
import { RequestUserContext } from 'src/common/contexts/user-context.service';
import { CreateManagementCommitteeDto } from '../dtos/management-committee/create-management-committee.dto';
import { CreateManagementCommitteeForUserDto } from '../dtos/management-committee/create-management-committee-for-user.dto';
import { ManagementCommitteeResponseDto } from '../dtos/management-committee/management-committee-response.dto';

@Injectable()
export class ManagementCommitteeService {
  private readonly logger = new Logger(ManagementCommitteeService.name);

  constructor(
    @Inject(MANAGEMENT_COMMITTEE_REPOSITORY)
    private readonly repository: ManagementCommitteeRepository,
    private readonly userContext: RequestUserContext,
  ) {}

  async create(
    userId: string,
    dto: CreateManagementCommitteeDto,
  ): Promise<ManagementCommitteeResponseDto> {
    return this.createInternal(dto.committeeId, dto.name, userId);
  }

  async createForUser(
    dto: CreateManagementCommitteeForUserDto,
  ): Promise<ManagementCommitteeResponseDto> {
    return this.createInternal(dto.committeeId, dto.name, dto.userId);
  }

  async findAll(
    limit = 10,
    offset = 0,
  ): Promise<ManagementCommitteeResponseDto[]> {
    const entities = await this.repository.findAll(limit, offset);
    return entities.map(ManagementCommitteeResponseDto.fromDomain);
  }

  async findAllByCurrentUser(
    limit = 10,
    offset = 0,
  ): Promise<ManagementCommitteeResponseDto[]> {
    const userId = this.userContext.getUserId();
    const entities = await this.repository.findAllByUserId(
      userId,
      limit,
      offset,
    );
    return entities.map(ManagementCommitteeResponseDto.fromDomain);
  }

  async findById(id: string): Promise<ManagementCommitteeResponseDto> {
    const entity = await this.repository.findById(id);
    if (!entity) {
      this.logger.warn(`No existe un comité con id ${id}`);
      throw new NotFoundException(`No existe un comité con id ${id}`);
    }
    return ManagementCommitteeResponseDto.fromDomain(entity);
  }

  private async createInternal(
    committeeId: string,
    name: string,
    userId: string,
  ): Promise<ManagementCommitteeResponseDto> {
    const existing = await this.repository.findByName?.(name, userId);
    if (existing) {
      throw new ConflictException(
        'Ya existe un comité con ese nombre para este usuario',
      );
    }

    const entity = ManagementCommittee.create(committeeId, name, userId);
    const saved = await this.repository.save(entity);
    return ManagementCommitteeResponseDto.fromDomain(saved);
  }
}
