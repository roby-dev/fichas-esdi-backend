import { CaregiverAttendanceReportService } from './caregiver-attendance-report.service';
import { CaregiverMotherRepository } from 'src/domain/repositories/caregiver-mother.repository';
import { CaregiverHallAssignmentRepository } from 'src/domain/repositories/caregiver-hall-assignment.repository';
import { CaregiverScheduleRepository } from 'src/domain/repositories/caregiver-schedule.repository';
import { CaregiverAttendanceRepository } from 'src/domain/repositories/caregiver-attendance.repository';
import { CaregiverAttendanceExceptionRepository } from 'src/domain/repositories/caregiver-attendance-exception.repository';
import { CommunityHallRepository } from 'src/domain/repositories/community-hall.repository';
import { CommitteeRepository } from 'src/domain/repositories/committee.repository';
import { CaregiverAttendanceScopeService } from './caregiver-attendance-scope.service';
import { CaregiverMother } from 'src/domain/entities/caregiver-mother.entity';
import { CaregiverHallAssignment } from 'src/domain/entities/caregiver-hall-assignment.entity';
import { CaregiverScheduleVersion } from 'src/domain/entities/caregiver-schedule-version.entity';
import { CaregiverAttendanceRecord } from 'src/domain/entities/caregiver-attendance-record.entity';
import { CaregiverAttendanceException } from 'src/domain/entities/caregiver-attendance-exception.entity';
import { CommunityHall } from 'src/domain/entities/community-hall.entity';

const CGV_ID = '000000000000000000000001';
const HALL_ID = '00000000000000000000000a';
const COMMITTEE_ID = '00000000000000000000000c';
const BLOCK_ID = 'block-1';

const caregiver = CaregiverMother.fromPrimitives({
  id: CGV_ID,
  documentType: 'DNI',
  documentNumber: '12345678',
  firstName: 'Maria',
  lastName: 'Gonzalez',
  startDate: new Date('2025-01-01'),
  status: 'active',
});

const schedule = CaregiverScheduleVersion.create({
  communityHallId: HALL_ID,
  name: 'Default',
  validFrom: new Date('2025-01-01'),
  blocks: [
    {
      id: BLOCK_ID,
      name: 'Morning',
      entryTime: '08:00',
      exitTime: '12:00',
      exitRequired: false,
      toleranceMinutes: 10,
      markingWindowMinutes: 30,
    },
  ],
  dayRules: [
    { dayOfWeek: 1, isWorkingDay: true, blockIds: [BLOCK_ID] },
    { dayOfWeek: 2, isWorkingDay: true, blockIds: [BLOCK_ID] },
  ],
});

const assignment = CaregiverHallAssignment.fromPrimitives({
  id: 'assign-1',
  caregiverId: CGV_ID,
  communityHallId: HALL_ID,
  validFrom: new Date('2025-01-01'),
});

describe('CaregiverAttendanceReportService', () => {
  let service: CaregiverAttendanceReportService;
  let caregiverRepo: jest.Mocked<CaregiverMotherRepository>;
  let assignmentRepo: jest.Mocked<CaregiverHallAssignmentRepository>;
  let scheduleRepo: jest.Mocked<CaregiverScheduleRepository>;
  let attendanceRepo: jest.Mocked<CaregiverAttendanceRepository>;
  let exceptionRepo: jest.Mocked<CaregiverAttendanceExceptionRepository>;
  let hallRepo: jest.Mocked<CommunityHallRepository>;
  let committeeRepo: jest.Mocked<CommitteeRepository>;
  let scopeService: jest.Mocked<CaregiverAttendanceScopeService>;

  beforeEach(() => {
    caregiverRepo = {
      findAll: jest.fn().mockResolvedValue([caregiver]),
    } as unknown as jest.Mocked<CaregiverMotherRepository>;

    assignmentRepo = {
      findByHallIdAndDateRange: jest.fn().mockResolvedValue([assignment]),
    } as unknown as jest.Mocked<CaregiverHallAssignmentRepository>;

    scheduleRepo = {
      findByHallId: jest.fn().mockResolvedValue([schedule]),
    } as unknown as jest.Mocked<CaregiverScheduleRepository>;

    attendanceRepo = {
      findByHallAndDateRange: jest.fn().mockResolvedValue([]),
    } as unknown as jest.Mocked<CaregiverAttendanceRepository>;

    exceptionRepo = {
      findByHallDateRange: jest.fn().mockResolvedValue([]),
      findByCaregiverDateRange: jest.fn().mockResolvedValue([]),
    } as unknown as jest.Mocked<CaregiverAttendanceExceptionRepository>;

    hallRepo = {
      findAllByCommitteeRef: jest
        .fn()
        .mockResolvedValue([
          new CommunityHall('LOC-001', 'Hall A', COMMITTEE_ID, HALL_ID),
        ]),
    } as unknown as jest.Mocked<CommunityHallRepository>;

    committeeRepo = {
      findById: jest.fn().mockResolvedValue(null),
    } as unknown as jest.Mocked<CommitteeRepository>;

    scopeService = {
      getAccessibleHallIds: jest.fn().mockResolvedValue(null),
      ensureCanManageCommittee: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<CaregiverAttendanceScopeService>;

    service = new CaregiverAttendanceReportService(
      caregiverRepo,
      assignmentRepo,
      scheduleRepo,
      attendanceRepo,
      exceptionRepo,
      hallRepo,
      committeeRepo,
      scopeService,
    );
  });

  describe('hallMonthlyReport', () => {
    it('counts present and absent days using historical schedules and assignments', async () => {
      attendanceRepo.findByHallAndDateRange.mockResolvedValue([
        CaregiverAttendanceRecord.createOfficial({
          caregiverId: CGV_ID,
          communityHallId: HALL_ID,
          localDate: '2025-01-06',
          blockId: BLOCK_ID,
          entryTime: '08:05',
          source: 'self-service',
        }),
      ]);

      const report = await service.hallMonthlyReport(HALL_ID, 2025, 1, true, [
        'admin',
      ]);

      expect(report.hallId).toBe(HALL_ID);
      expect(report.caregivers).toHaveLength(1);
      const summary = report.caregivers[0];
      expect(summary.presentCount).toBe(1);
      expect(summary.unjustifiedAbsenceCount).toBeGreaterThan(0);
    });

    it('counts a tardy mark separately', async () => {
      attendanceRepo.findByHallAndDateRange.mockResolvedValue([
        CaregiverAttendanceRecord.createOfficial({
          caregiverId: CGV_ID,
          communityHallId: HALL_ID,
          localDate: '2025-01-06',
          blockId: BLOCK_ID,
          entryTime: '08:15',
          source: 'self-service',
        }),
      ]);

      const report = await service.hallMonthlyReport(HALL_ID, 2025, 1, false, [
        'admin',
      ]);

      expect(report.caregivers[0].tardyCount).toBe(1);
    });

    it('counts a caregiver justification as a justified absence when no mark exists', async () => {
      const singleDaySchedule = CaregiverScheduleVersion.create({
        communityHallId: HALL_ID,
        name: 'Single day',
        validFrom: new Date('2025-01-06'),
        validTo: new Date('2025-01-06'),
        blocks: [
          {
            id: BLOCK_ID,
            name: 'Morning',
            entryTime: '08:00',
            exitTime: '12:00',
            exitRequired: false,
            toleranceMinutes: 10,
            markingWindowMinutes: 30,
          },
        ],
        dayRules: [
          { dayOfWeek: 1, isWorkingDay: true, blockIds: [BLOCK_ID] },
        ],
      });
      scheduleRepo.findByHallId.mockResolvedValue([singleDaySchedule]);

      exceptionRepo.findByCaregiverDateRange.mockResolvedValue([
        CaregiverAttendanceException.caregiverJustification({
          caregiverId: CGV_ID,
          localDate: '2025-01-06',
          blockId: BLOCK_ID,
          reason: 'Medical appointment',
        }),
      ]);

      const report = await service.hallMonthlyReport(HALL_ID, 2025, 1, true, [
        'admin',
      ]);

      const summary = report.caregivers[0];
      expect(summary.justifiedAbsenceCount).toBe(1);
      expect(summary.unjustifiedAbsenceCount).toBe(0);
      expect(summary.outcomes[0].outcome).toBe('justified');
      expect(summary.outcomes[0].localDate).toBe('2025-01-06');
    });
  });

  describe('committeeMonthlyReport', () => {
    it('aggregates totals across accessible halls', async () => {
      attendanceRepo.findByHallAndDateRange.mockResolvedValue([
        CaregiverAttendanceRecord.createOfficial({
          caregiverId: CGV_ID,
          communityHallId: HALL_ID,
          localDate: '2025-01-06',
          blockId: BLOCK_ID,
          entryTime: '08:05',
          source: 'self-service',
        }),
      ]);

      const report = await service.committeeMonthlyReport(
        COMMITTEE_ID,
        2025,
        1,
        false,
        ['admin'],
      );

      expect(report.committeeId).toBe(COMMITTEE_ID);
      expect(report.halls).toHaveLength(1);
      expect(report.halls[0].presentCount).toBe(1);
    });
  });
});
