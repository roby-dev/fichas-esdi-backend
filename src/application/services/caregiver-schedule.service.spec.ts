import { CaregiverScheduleService } from './caregiver-schedule.service';
import { CaregiverScheduleRepository } from 'src/domain/repositories/caregiver-schedule.repository';
import { CommunityHallRepository } from 'src/domain/repositories/community-hall.repository';
import { CaregiverAttendanceScopeService } from './caregiver-attendance-scope.service';
import { CaregiverScheduleVersion } from 'src/domain/entities/caregiver-schedule-version.entity';
import { NotFoundException } from 'src/domain/exceptions';
import { CreateScheduleVersionDto } from '../dtos/caregiver-attendance/create-schedule-version.dto';
import { CommunityHall } from 'src/domain/entities/community-hall.entity';

describe('CaregiverScheduleService', () => {
  let service: CaregiverScheduleService;
  let scheduleRepo: jest.Mocked<CaregiverScheduleRepository>;
  let hallRepo: jest.Mocked<CommunityHallRepository>;
  let scopeService: jest.Mocked<CaregiverAttendanceScopeService>;

  const HALL_ID = '00000000000000000000000a';

  beforeEach(() => {
    scheduleRepo = {
      save: jest.fn(),
      findById: jest.fn(),
      findActiveByHallAndDate: jest.fn(),
      findByHallId: jest.fn(),
      closeCurrentVersion: jest.fn(),
      copyToHall: jest.fn(),
    } as unknown as jest.Mocked<CaregiverScheduleRepository>;

    hallRepo = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<CommunityHallRepository>;

    scopeService = {
      ensureCanManageHall: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<CaregiverAttendanceScopeService>;

    service = new CaregiverScheduleService(
      scheduleRepo,
      hallRepo,
      scopeService,
    );
  });

  const baseDto: CreateScheduleVersionDto = {
    communityHallId: HALL_ID,
    name: 'Default',
    validFrom: '2025-01-01',
    blocks: [
      {
        id: 'block-1',
        name: 'Morning',
        entryTime: '08:00',
        exitTime: '12:00',
        exitRequired: false,
        toleranceMinutes: 10,
        markingWindowMinutes: 30,
      },
    ],
    dayRules: [{ dayOfWeek: 1, isWorkingDay: true, blockIds: ['block-1'] }],
  };

  describe('create', () => {
    it('creates a schedule version and closes the previous one', async () => {
      hallRepo.findById.mockResolvedValue(
        new CommunityHall('LOC-001', 'Hall A', 'committee-1', HALL_ID),
      );
      scheduleRepo.save.mockImplementation(async (v) =>
        CaregiverScheduleVersion.fromPrimitives({
          ...v.toPrimitives(),
          id: 'sched-1',
        }),
      );

      const result = await service.create(baseDto, ['admin']);

      expect(scheduleRepo.closeCurrentVersion).toHaveBeenCalledWith(
        HALL_ID,
        expect.any(Date),
      );
      expect(result.communityHallId).toBe(HALL_ID);
    });

    it('throws NotFoundException when the hall does not exist', async () => {
      hallRepo.findById.mockResolvedValue(null);

      await expect(service.create(baseDto, ['admin'])).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('copyToHall', () => {
    it('delegates copying to the repository', async () => {
      const copy = CaregiverScheduleVersion.fromPrimitives({
        id: 'sched-2',
        communityHallId: 'target-hall',
        name: 'Copied',
        validFrom: new Date('2025-07-01'),
        validTo: null,
        blocks: [],
        dayRules: [],
        specialDays: [],
      });
      scheduleRepo.copyToHall.mockResolvedValue(copy);

      const result = await service.copyToHall(
        'sched-1',
        {
          targetHallId: 'target-hall',
          validFrom: '2025-07-01',
          name: 'Copied',
        },
        ['admin'],
      );

      expect(result.name).toBe('Copied');
    });
  });
});
