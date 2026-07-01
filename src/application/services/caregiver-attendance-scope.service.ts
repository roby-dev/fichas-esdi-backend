import { Inject, Injectable } from '@nestjs/common';
import { RequestUserContext } from 'src/common/contexts/user-context.service';
import {
  COMMITTEE_MEMBERSHIP_REPOSITORY,
  COMMUNITY_HALL_REPOSITORY,
} from 'src/domain/constants/tokens';
import { UnauthorizedException } from 'src/domain/exceptions';
import type { CommunityHallRepository } from 'src/domain/repositories/community-hall.repository';
import type { CommitteeMembershipRepository } from 'src/domain/repositories/committee-membership.repository';

@Injectable()
export class CaregiverAttendanceScopeService {
  constructor(
    private readonly userContext: RequestUserContext,
    @Inject(COMMUNITY_HALL_REPOSITORY)
    private readonly hallRepository: CommunityHallRepository,
    @Inject(COMMITTEE_MEMBERSHIP_REPOSITORY)
    private readonly membershipRepository: CommitteeMembershipRepository,
  ) {}

  async ensureCanManageHall(hallId: string, roles: string[]): Promise<void> {
    if (roles.includes('admin')) return;

    const hall = await this.hallRepository.findById(hallId);
    if (!hall) {
      throw new UnauthorizedException('Local comunal no encontrado');
    }

    const assignedCommittees = await this.getAssignedCommitteeIds(roles);
    if (!assignedCommittees.includes(hall.committeeRef)) {
      throw new UnauthorizedException(
        'No tiene permiso para gestionar este local comunal',
      );
    }
  }

  async ensureCanManageCommittee(
    committeeId: string,
    roles: string[],
  ): Promise<void> {
    if (roles.includes('admin')) return;

    const assignedCommittees = await this.getAssignedCommitteeIds(roles);
    if (!assignedCommittees.includes(committeeId)) {
      throw new UnauthorizedException(
        'No tiene permiso para gestionar este comité',
      );
    }
  }

  /**
   * Returns the hall IDs accessible to the current user.
   * `null` means the user can access every hall (admin).
   */
  async getAccessibleHallIds(roles: string[]): Promise<string[] | null> {
    if (roles.includes('admin')) return null;

    const committeeIds = await this.getAssignedCommitteeIds(roles);
    const halls = await Promise.all(
      committeeIds.map((id) =>
        this.hallRepository.findAllByCommitteeRef(id, 1000, 0),
      ),
    );
    return halls.flat().map((hall) => hall.id!);
  }

  private async getAssignedCommitteeIds(roles: string[]): Promise<string[]> {
    if (!roles.includes('AT')) return [];

    const userId = this.userContext.getUserId();
    const memberships = await this.membershipRepository.findAllByUserRef(
      userId,
      1000,
      0,
    );
    return memberships.map((m) => m.committeeRef);
  }
}
