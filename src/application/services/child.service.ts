import { Inject, Injectable } from '@nestjs/common';
import { ConflictException, NotFoundException } from 'src/domain/exceptions';
import {
  CHILD_REPOSITORY,
  COMMUNITY_HALL_REPOSITORY,
  USER_REPOSITORY,
} from 'src/domain/constants/tokens';
import type { ChildRepository } from 'src/domain/repositories/child.repository';
import type { CommunityHallRepository } from 'src/domain/repositories/community-hall.repository';
import type { UserRepository } from 'src/domain/repositories/user.repository';
import { Child } from 'src/domain/entities/child.entity';
import { RequestUserContext } from 'src/common/contexts/user-context.service';
import { CreateChildDto } from '../dtos/child/create-child.dto';
import { UpdateChildDto } from '../dtos/child/update-child.dto';
import { ChildResponseDto } from '../dtos/child/child-response.dto';
import { UserResponseDto } from '../dtos/user/user-response.dto';
import { UserWithChildrenDto } from '../dtos/child/user-with-children.dto';
import { AuditService } from './audit.service';

const CHILD_ENTITY_TYPE = 'Child';

@Injectable()
export class ChildService {
  constructor(
    @Inject(CHILD_REPOSITORY)
    private readonly childRepository: ChildRepository,
    @Inject(COMMUNITY_HALL_REPOSITORY)
    private readonly hallRepository: CommunityHallRepository,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    private readonly userContext: RequestUserContext,
    private readonly auditService: AuditService,
  ) {}

  async create(dto: CreateChildDto): Promise<ChildResponseDto> {
    const hall = await this.hallRepository.findById(dto.communityHallId);
    if (!hall) {
      throw new NotFoundException(
        `No existe un local comunal con Id ${dto.communityHallId}`,
      );
    }

    const existing =
      await this.childRepository.findByDocumentNumberAndCommunnityHallId(
        dto.documentNumber,
        dto.communityHallId,
      );
    if (existing) {
      throw new ConflictException(
        `Ya existe un niño registrado en el local comunal ${hall.name}`,
      );
    }

    const userId = this.userContext.getUserId();
    const child = Child.create(
      dto.documentNumber,
      dto.firstName,
      dto.lastName,
      new Date(dto.birthday),
      new Date(dto.admissionDate),
      dto.communityHallId,
      userId,
      hall,
    );
    const saved = await this.childRepository.save(child);

    await this.auditService.record({
      action: 'child.create',
      entityType: CHILD_ENTITY_TYPE,
      entityId: saved.id!,
      before: null,
      after: saved.toPrimitives(),
    });

    return ChildResponseDto.fromDomain(saved);
  }

  async update(id: string, dto: UpdateChildDto): Promise<ChildResponseDto> {
    const existing = await this.childRepository.findById(id);
    if (!existing) {
      throw new NotFoundException(`No se encontró un niño con el ID ${id}`);
    }

    const before = existing.toPrimitives();

    const updated = new Child(
      dto.documentNumber,
      dto.firstName,
      dto.lastName,
      dto.birthday,
      dto.admissionDate,
      dto.communityHallId,
      id,
    );
    const result = await this.childRepository.update(updated);

    await this.auditService.record({
      action: 'child.update',
      entityType: CHILD_ENTITY_TYPE,
      entityId: id,
      before,
      after: result.toPrimitives(),
    });

    return ChildResponseDto.fromDomain(result);
  }

  async delete(id: string): Promise<void> {
    const exists = await this.childRepository.findById(id);
    if (!exists) {
      throw new NotFoundException(`No se encontró un niño con el ID ${id}`);
    }

    const before = exists.toPrimitives();
    await this.childRepository.delete(id);

    await this.auditService.record({
      action: 'child.delete',
      entityType: CHILD_ENTITY_TYPE,
      entityId: id,
      before,
      after: null,
    });
  }

  async findById(id: string): Promise<ChildResponseDto> {
    const child = await this.childRepository.findById(id);
    if (!child) {
      throw new NotFoundException(`No se encontró un niño con el ID ${id}`);
    }
    return ChildResponseDto.fromDomain(child);
  }

  async findAllByCurrentUser(
    limit = 10,
    offset = 0,
  ): Promise<ChildResponseDto[]> {
    const userId = this.userContext.getUserId();
    const children = await this.childRepository.findAlllByUser(
      userId,
      limit,
      offset,
    );
    return children.map(ChildResponseDto.fromDomain);
  }

  async findAllByCommittee(committeeId: string): Promise<ChildResponseDto[]> {
    const children = await this.childRepository.findAllByCommittee(committeeId);
    return children.map(ChildResponseDto.fromDomain);
  }

  async findAllGroupedByUser(): Promise<UserWithChildrenDto[]> {
    const [groups, users] = await Promise.all([
      this.childRepository.findAllGroupedByUser(),
      this.userRepository.findAll(1000, 0),
    ]);

    const userMap = new Map(users.map((u) => [u.id!, u]));

    return groups
      .filter((g) => userMap.has(g.userId))
      .map((g) => ({
        user: UserResponseDto.fromDomain(userMap.get(g.userId)!),
        children: g.children.map(ChildResponseDto.fromDomain),
      }));
  }
}
