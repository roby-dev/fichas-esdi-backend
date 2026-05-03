import { Inject, Injectable } from '@nestjs/common';
import {
  CHILD_REPOSITORY,
  COMMITTEE_REPOSITORY,
  COMMUNITY_HALL_REPOSITORY,
} from 'src/domain/constants/tokens';
import type { ChildRepository } from 'src/domain/repositories/child.repository';
import type { CommitteeRepository } from 'src/domain/repositories/committee.repository';
import type { CommunityHallRepository } from 'src/domain/repositories/community-hall.repository';
import {
  ActiveSignalCountDto,
  CommitteeChildCountDto,
  CommunityHallChildCountDto,
  DashboardStatsResponseDto,
} from 'src/application/dtos/dashboard/dashboard-stats-response.dto';

@Injectable()
export class AdminDashboardService {
  constructor(
    @Inject(CHILD_REPOSITORY)
    private readonly childRepository: ChildRepository,
    @Inject(COMMUNITY_HALL_REPOSITORY)
    private readonly communityHallRepository: CommunityHallRepository,
    @Inject(COMMITTEE_REPOSITORY)
    private readonly committeeRepository: CommitteeRepository,
  ) {}

  async getStats(): Promise<DashboardStatsResponseDto> {
    const [children, halls, committees] = await Promise.all([
      this.childRepository.findAllUnpaginated(),
      this.communityHallRepository.findAllUnpaginated(),
      this.committeeRepository.findAllUnpaginated(),
    ]);

    const committeeById = new Map(
      committees.map((c) => [c.id ?? '', c]),
    );
    const hallById = new Map(halls.map((h) => [h.id ?? '', h]));

    const activeChildren = children.filter((c) => !c.isGraduated);

    const committeeCounts = new Map<string, number>();
    const hallCounts = new Map<string, number>();
    const signalCounts = new Map<string, number>();
    let activeSignalsTotal = 0;

    for (const child of activeChildren) {
      const hallId = child.communityHallId;
      const hall = hallById.get(hallId);
      hallCounts.set(hallId, (hallCounts.get(hallId) ?? 0) + 1);

      if (hall) {
        const committeeId = hall.committeeRef;
        committeeCounts.set(
          committeeId,
          (committeeCounts.get(committeeId) ?? 0) + 1,
        );
      }

      const signal = child.activeAlertSignal;
      if (signal) {
        activeSignalsTotal += 1;
        signalCounts.set(signal, (signalCounts.get(signal) ?? 0) + 1);
      }
    }

    const childrenByCommittee: CommitteeChildCountDto[] = committees.map(
      (committee) => ({
        committeeId: committee.id ?? '',
        name: committee.name,
        count: committeeCounts.get(committee.id ?? '') ?? 0,
      }),
    );

    const childrenByCommunityHall: CommunityHallChildCountDto[] = halls.map(
      (hall) => {
        const committee = committeeById.get(hall.committeeRef);
        return {
          hallId: hall.id ?? '',
          name: hall.name,
          committeeId: hall.committeeRef,
          committeeName: committee?.name ?? '',
          count: hallCounts.get(hall.id ?? '') ?? 0,
        };
      },
    );

    const byType: ActiveSignalCountDto[] = Array.from(
      signalCounts.entries(),
    ).map(([signal, count]) => ({ signal, count }));

    return {
      childrenByCommittee,
      childrenByCommunityHall,
      activeSignals: {
        total: activeSignalsTotal,
        byType,
      },
    };
  }
}
