import { Inject, Injectable } from '@nestjs/common';
import { ConflictException, NotFoundException } from 'src/domain/exceptions';
import {
  COMMITTEE_MEMBERSHIP_REPOSITORY,
  COMMITTEE_REPOSITORY,
  USER_REPOSITORY,
} from 'src/domain/constants/tokens';
import { CommitteeMembership } from 'src/domain/entities/committee-membership.entity';
import type { CommitteeMembershipRepository } from 'src/domain/repositories/committee-membership.repository';
import type { CommitteeRepository } from 'src/domain/repositories/committee.repository';
import type { UserRepository } from 'src/domain/repositories/user.repository';
import { RequestUserContext } from 'src/common/contexts/user-context.service';
import { CreateCommitteeMembershipDto } from '../dtos/committee-membership/create-committee-membership.dto';
import { CommitteeMembershipResponseDto } from '../dtos/committee-membership/committee-membership-response.dto';

@Injectable()
export class CommitteeMembershipService {
  constructor(
    @Inject(COMMITTEE_MEMBERSHIP_REPOSITORY)
    private readonly repository: CommitteeMembershipRepository,
    @Inject(COMMITTEE_REPOSITORY)
    private readonly committeeRepository: CommitteeRepository,
    @Inject(USER_REPOSITORY)
    private readonly userRepository: UserRepository,
    private readonly userContext: RequestUserContext,
  ) {}

  async assign(
    dto: CreateCommitteeMembershipDto,
  ): Promise<CommitteeMembershipResponseDto> {
    const committee = await this.committeeRepository.findById(dto.committeeRef);
    if (!committee) {
      throw new NotFoundException(
        `No existe un comité con id ${dto.committeeRef}`,
      );
    }

    const user = await this.userRepository.findById(dto.userRef);
    if (!user) {
      throw new NotFoundException(`No existe un usuario con id ${dto.userRef}`);
    }

    const existing = await this.repository.findByCommitteeAndUser(
      dto.committeeRef,
      dto.userRef,
    );
    if (existing) {
      throw new ConflictException(
        'El usuario ya está asignado a ese comité',
      );
    }

    const entity = CommitteeMembership.create(dto.committeeRef, dto.userRef);
    const saved = await this.repository.save(entity);
    return CommitteeMembershipResponseDto.fromDomain(saved);
  }

  async unassign(id: string): Promise<void> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException(`No existe la asignación con id ${id}`);
    }
    await this.repository.delete(id);
  }

  async findById(id: string): Promise<CommitteeMembershipResponseDto> {
    const entity = await this.repository.findById(id);
    if (!entity) {
      throw new NotFoundException(`No existe la asignación con id ${id}`);
    }
    return CommitteeMembershipResponseDto.fromDomain(entity);
  }

  async findCommitteesOfCurrentUser(
    limit = 10,
    offset = 0,
  ): Promise<CommitteeMembershipResponseDto[]> {
    const userId = this.userContext.getUserId();
    const memberships = await this.repository.findAllByUserRef(
      userId,
      limit,
      offset,
    );
    return memberships.map(CommitteeMembershipResponseDto.fromDomain);
  }

  async findCommitteesOfUser(
    userId: string,
    limit = 10,
    offset = 0,
  ): Promise<CommitteeMembershipResponseDto[]> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException(`No existe un usuario con id ${userId}`);
    }
    const memberships = await this.repository.findAllByUserRef(
      userId,
      limit,
      offset,
    );
    return memberships.map(CommitteeMembershipResponseDto.fromDomain);
  }

  async findUsersOfCommittee(
    committeeId: string,
    limit = 10,
    offset = 0,
  ): Promise<CommitteeMembershipResponseDto[]> {
    const committee = await this.committeeRepository.findById(committeeId);
    if (!committee) {
      throw new NotFoundException(
        `No existe un comité con id ${committeeId}`,
      );
    }
    const memberships = await this.repository.findAllByCommitteeRef(
      committeeId,
      limit,
      offset,
    );
    return memberships.map(CommitteeMembershipResponseDto.fromDomain);
  }

  async findAll(
    limit = 10,
    offset = 0,
  ): Promise<CommitteeMembershipResponseDto[]> {
    const memberships = await this.repository.findAll(limit, offset);
    return memberships.map(CommitteeMembershipResponseDto.fromDomain);
  }
}
