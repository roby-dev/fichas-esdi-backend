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
    // Excel-imported children carry no communityHallId/committee FK — only the
    // denormalized committeeCode and hall name. Resolve via these fallbacks.
    const committeeByCode = new Map(
      committees.map((c) => [c.committeeId, c]),
    );
    const hallByName = new Map(halls.map((h) => [h.name, h]));

    const activeChildren = children.filter((c) => !c.isGraduated);

    const committeeCounts = new Map<string, number>();
    const hallCounts = new Map<string, number>();
    const signalCounts = new Map<string, number>();
    let activeSignalsTotal = 0;

    for (const child of activeChildren) {
      // Resolve hall: prefer FK, fall back to denormalized name.
      const hall =
        (child.communityHallId
          ? hallById.get(child.communityHallId)
          : undefined) ??
        (child.communityHallName
          ? hallByName.get(child.communityHallName)
          : undefined);

      // Resolve committee: prefer the denormalized code (present on every child
      // after backfill), fall back to the resolved hall's committeeRef.
      const committeeId =
        (child.managementCommitteCode
          ? committeeByCode.get(child.managementCommitteCode)?.id
          : undefined) ?? hall?.committeeRef;

      if (hall) {
        hallCounts.set(hall.id ?? '', (hallCounts.get(hall.id ?? '') ?? 0) + 1);
      }

      if (committeeId) {
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
