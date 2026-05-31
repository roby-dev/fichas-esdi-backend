import { AdminDashboardService } from './admin-dashboard.service';
import type { ChildRepository } from 'src/domain/repositories/child.repository';
import type { CommunityHallRepository } from 'src/domain/repositories/community-hall.repository';
import type { CommitteeRepository } from 'src/domain/repositories/committee.repository';
import { Child } from 'src/domain/entities/child.entity';
import { CommunityHall } from 'src/domain/entities/community-hall.entity';
import { Committee } from 'src/domain/entities/committee.entity';

describe('AdminDashboardService.getStats', () => {
  let service: AdminDashboardService;
  let childRepo: jest.Mocked<ChildRepository>;
  let hallRepo: jest.Mocked<CommunityHallRepository>;
  let committeeRepo: jest.Mocked<CommitteeRepository>;

  const COMMITTEE_ID = 'cmt-1';
  const HALL_ID = 'hall-1';

  // Birthday recent enough that the child is not graduated as of test run.
  const birthday = new Date('2024-03-27T00:00:00.000Z');
  const admissionDate = new Date('2025-08-01T00:00:00.000Z');

  const committee = Committee.fromPrimitives({
    id: COMMITTEE_ID,
    committeeId: '315',
    name: 'PAN DE VIDA',
  });

  const hall = CommunityHall.fromPrimitives({
    id: HALL_ID,
    localId: 'LOC-1',
    name: 'LOCAL - PAN DE VIDA',
    committeeRef: COMMITTEE_ID,
  });

  beforeEach(() => {
    childRepo = {
      findAllUnpaginated: jest.fn(),
    } as unknown as jest.Mocked<ChildRepository>;
    hallRepo = {
      findAllUnpaginated: jest.fn().mockResolvedValue([hall]),
    } as unknown as jest.Mocked<CommunityHallRepository>;
    committeeRepo = {
      findAllUnpaginated: jest.fn().mockResolvedValue([committee]),
    } as unknown as jest.Mocked<CommitteeRepository>;

    service = new AdminDashboardService(childRepo, hallRepo, committeeRepo);
  });

  it('counts Excel-imported children (no communityHallId) into their committee via managementCommitteCode', async () => {
    const formChild = Child.fromPrimitives({
      documentNumber: '93775781',
      firstName: 'DANIEL FRANK',
      lastName: 'CAHUANA GALLEGOS',
      birthday,
      admissionDate,
      communityHallId: HALL_ID,
      communityHallName: 'LOCAL - PAN DE VIDA',
      managementCommitteCode: '315',
      managementCommitteName: 'PAN DE VIDA',
    });

    const migratedChild = Child.fromPrimitives({
      documentNumber: '93046897',
      firstName: null as unknown as string,
      lastName: null as unknown as string,
      fullName: 'DANNA NICOLE AYMA MAMANI',
      birthday,
      admissionDate,
      communityHallId: null,
      communityHallName: 'LOCAL - PAN DE VIDA',
      managementCommitteCode: '315',
      managementCommitteName: 'PAN DE VIDA',
    });

    childRepo.findAllUnpaginated.mockResolvedValue([formChild, migratedChild]);

    const stats = await service.getStats();

    const panDeVida = stats.childrenByCommittee.find(
      (c) => c.committeeId === COMMITTEE_ID,
    );
    expect(panDeVida?.count).toBe(2);

    const localHall = stats.childrenByCommunityHall.find(
      (h) => h.hallId === HALL_ID,
    );
    expect(localHall?.count).toBe(2);
  });
});
