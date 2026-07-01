import { CaregiverAttendanceScopeService } from './caregiver-attendance-scope.service';
import { RequestUserContext } from 'src/common/contexts/user-context.service';
import { CommunityHallRepository } from 'src/domain/repositories/community-hall.repository';
import { CommitteeMembershipRepository } from 'src/domain/repositories/committee-membership.repository';
import { UnauthorizedException } from 'src/domain/exceptions';
import { CommunityHall } from 'src/domain/entities/community-hall.entity';
import { CommitteeMembership } from 'src/domain/entities/committee-membership.entity';

describe('CaregiverAttendanceScopeService', () => {
  let service: CaregiverAttendanceScopeService;
  let userContext: jest.Mocked<RequestUserContext>;
  let hallRepo: jest.Mocked<CommunityHallRepository>;
  let membershipRepo: jest.Mocked<CommitteeMembershipRepository>;

  const ADMIN_ID = '000000000000000000000001';
  const AT_ID = '000000000000000000000002';
  const HALL_ID = '00000000000000000000000a';
  const OTHER_HALL_ID = '00000000000000000000000b';
  const COMMITTEE_ID = '00000000000000000000000c';

  beforeEach(() => {
    userContext = {
      getUserId: jest.fn(),
      getUserEmail: jest.fn(),
    } as unknown as jest.Mocked<RequestUserContext>;

    hallRepo = {
      findById: jest.fn(),
      findAllByCommitteeRef: jest.fn(),
    } as unknown as jest.Mocked<CommunityHallRepository>;

    membershipRepo = {
      findAllByUserRef: jest.fn(),
    } as unknown as jest.Mocked<CommitteeMembershipRepository>;

    service = new CaregiverAttendanceScopeService(
      userContext,
      hallRepo,
      membershipRepo,
    );
  });

  describe('ensureCanManageHall', () => {
    it('allows admin users to manage any hall', async () => {
      userContext.getUserId.mockReturnValue(ADMIN_ID);
      hallRepo.findById.mockResolvedValue(
        new CommunityHall('LOC-001', 'Hall A', COMMITTEE_ID, HALL_ID),
      );

      await expect(
        service.ensureCanManageHall(HALL_ID, ['admin']),
      ).resolves.toBeUndefined();
    });

    it('allows AT users to manage a hall in an assigned committee', async () => {
      userContext.getUserId.mockReturnValue(AT_ID);
      hallRepo.findById.mockResolvedValue(
        new CommunityHall('LOC-001', 'Hall A', COMMITTEE_ID, HALL_ID),
      );
      membershipRepo.findAllByUserRef.mockResolvedValue([
        CommitteeMembership.fromPrimitives({
          id: 'mem-1',
          committeeRef: COMMITTEE_ID,
          userRef: AT_ID,
        }),
      ]);

      await expect(
        service.ensureCanManageHall(HALL_ID, ['AT']),
      ).resolves.toBeUndefined();
    });

    it('denies AT users for halls outside assigned committees', async () => {
      userContext.getUserId.mockReturnValue(AT_ID);
      hallRepo.findById.mockResolvedValue(
        new CommunityHall(
          'LOC-002',
          'Hall B',
          'other-committee',
          OTHER_HALL_ID,
        ),
      );
      membershipRepo.findAllByUserRef.mockResolvedValue([
        CommitteeMembership.fromPrimitives({
          id: 'mem-1',
          committeeRef: COMMITTEE_ID,
          userRef: AT_ID,
        }),
      ]);

      await expect(
        service.ensureCanManageHall(OTHER_HALL_ID, ['AT']),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('getAccessibleHallIds', () => {
    it('returns every hall id for admin users', async () => {
      userContext.getUserId.mockReturnValue(ADMIN_ID);

      const result = await service.getAccessibleHallIds(['admin']);

      expect(result).toBeNull();
    });

    it('returns hall ids belonging to assigned committees for AT users', async () => {
      userContext.getUserId.mockReturnValue(AT_ID);
      membershipRepo.findAllByUserRef.mockResolvedValue([
        CommitteeMembership.fromPrimitives({
          id: 'mem-1',
          committeeRef: COMMITTEE_ID,
          userRef: AT_ID,
        }),
      ]);
      hallRepo.findAllByCommitteeRef.mockResolvedValue([
        new CommunityHall('LOC-001', 'Hall A', COMMITTEE_ID, HALL_ID),
      ]);

      const result = await service.getAccessibleHallIds(['AT']);

      expect(result).toEqual([HALL_ID]);
    });
  });
});
