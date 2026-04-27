import { Inject, Injectable } from '@nestjs/common';
import { NotFoundException } from 'src/domain/exceptions';
import { COMMITTEE_REPOSITORY } from 'src/domain/constants/tokens';
import { Committee } from 'src/domain/entities/committee.entity';
import type { CommitteeRepository } from 'src/domain/repositories/committee.repository';
import { CreateUpdateCommitteeDto } from '../dtos/committee/create-update-committee.dto';
import { CommitteeResponseDto } from '../dtos/committee/committee-response.dto';

@Injectable()
export class CommitteeService {
  constructor(
    @Inject(COMMITTEE_REPOSITORY)
    private readonly committeeRepository: CommitteeRepository,
  ) {}

  async create(dto: CreateUpdateCommitteeDto): Promise<CommitteeResponseDto> {
    const entity = Committee.create(dto.committeeId, dto.name);
    const saved = await this.committeeRepository.save(entity);
    return CommitteeResponseDto.fromDomain(saved);
  }

  async findAll(limit = 10, offset = 0): Promise<CommitteeResponseDto[]> {
    const entities = await this.committeeRepository.findAll(limit, offset);
    return entities.map(CommitteeResponseDto.fromDomain);
  }

  async findById(id: string): Promise<CommitteeResponseDto> {
    const entity = await this.committeeRepository.findById(id);
    if (!entity) {
      throw new NotFoundException(`No existe un comité con id ${id}`);
    }
    return CommitteeResponseDto.fromDomain(entity);
  }

  async update(
    id: string,
    dto: CreateUpdateCommitteeDto,
  ): Promise<CommitteeResponseDto> {
    const existing = await this.committeeRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`No se encontró un comité con el ID ${id}`);
    }

    const update = new Committee(dto.committeeId, dto.name, existing.id);
    const saved = await this.committeeRepository.update(update);
    return CommitteeResponseDto.fromDomain(saved);
  }
}
