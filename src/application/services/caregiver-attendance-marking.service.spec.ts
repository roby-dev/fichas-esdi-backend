import { CaregiverAttendanceMarkingService } from './caregiver-attendance-marking.service';
import { CaregiverMotherRepository } from 'src/domain/repositories/caregiver-mother.repository';
import { CaregiverHallAssignmentRepository } from 'src/domain/repositories/caregiver-hall-assignment.repository';
import { CaregiverScheduleRepository } from 'src/domain/repositories/caregiver-schedule.repository';
import { CaregiverAttendanceRepository } from 'src/domain/repositories/caregiver-attendance.repository';
import { CaregiverAttendanceExceptionRepository } from 'src/domain/repositories/caregiver-attendance-exception.repository';
import { CaregiverAttendanceEventRepository } from 'src/domain/repositories/caregiver-attendance-event.repository';
import { CaregiverAttendanceScopeService } from './caregiver-attendance-scope.service';
import { AuditService } from './audit.service';
import { RequestUserContext } from 'src/common/contexts/user-context.service';
import { CaregiverMother } from 'src/domain/entities/caregiver-mother.entity';
import { CaregiverHallAssignment } from 'src/domain/entities/caregiver-hall-assignment.entity';
import { CaregiverScheduleVersion } from 'src/domain/entities/caregiver-schedule-version.entity';
import { CaregiverAttendanceRecord } from 'src/domain/entities/caregiver-attendance-record.entity';
import { BadRequestException } from 'src/domain/exceptions';

const CGV_ID = '000000000000000000000001';
const HALL_ID = '00000000000000000000000a';
const BLOCK_ID = 'block-1';

const activeCaregiver = CaregiverMother.fromPrimitives({
  id: CGV_ID,
  documentType: 'DNI',
  documentNumber: '12345678',
  firstName: 'Maria',
  lastName: 'Gonzalez',
  startDate: new Date('2025-01-01'),
  status: 'active',
});

const activeAssignment = CaregiverHallAssignment.fromPrimitives({
  id: 'assign-1',
  caregiverId: CGV_ID,
  communityHallId: HALL_ID,
  validFrom: new Date('2025-01-01'),
});

const activeSchedule = CaregiverScheduleVersion.create({
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
  dayRules: [{ dayOfWeek: 1, isWorkingDay: true, blockIds: [BLOCK_ID] }],
});

describe('CaregiverAttendanceMarkingService', () => {
  let service: CaregiverAttendanceMarkingService;
  let caregiverRepo: jest.Mocked<CaregiverMotherRepository>;
  let assignmentRepo: jest.Mocked<CaregiverHallAssignmentRepository>;
  let scheduleRepo: jest.Mocked<CaregiverScheduleRepository>;
  let attendanceRepo: jest.Mocked<CaregiverAttendanceRepository>;
  let exceptionRepo: jest.Mocked<CaregiverAttendanceExceptionRepository>;
  let eventRepo: jest.Mocked<CaregiverAttendanceEventRepository>;
  let scopeService: jest.Mocked<CaregiverAttendanceScopeService>;
  let auditService: jest.Mocked<AuditService>;
  let userContext: jest.Mocked<RequestUserContext>;

  beforeEach(() => {
    caregiverRepo = {
      findByIdentity: jest.fn(),
    } as unknown as jest.Mocked<CaregiverMotherRepository>;

    assignmentRepo = {
      findActiveByCaregiverAndDate: jest.fn(),
    } as unknown as jest.Mocked<CaregiverHallAssignmentRepository>;

    scheduleRepo = {
      findActiveByHallAndDate: jest.fn(),
    } as unknown as jest.Mocked<CaregiverScheduleRepository>;

    attendanceRepo = {
      save: jest.fn().mockImplementation(async (r) => r),
      existsOfficialMark: jest.fn(),
      voidMark: jest.fn(),
      findById: jest.fn(),
    } as unknown as jest.Mocked<CaregiverAttendanceRepository>;

    exceptionRepo = {
      findByHallAndDate: jest.fn().mockResolvedValue([]),
    } as unknown as jest.Mocked<CaregiverAttendanceExceptionRepository>;

    eventRepo = {
      save: jest.fn().mockImplementation(async (e) => e),
    } as unknown as jest.Mocked<CaregiverAttendanceEventRepository>;

    scopeService = {
      ensureCanManageHall: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<CaregiverAttendanceScopeService>;

    auditService = {
      record: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<AuditService>;

    userContext = {
      getUserId: jest.fn().mockReturnValue('user-1'),
    } as unknown as jest.Mocked<RequestUserContext>;

    service = new CaregiverAttendanceMarkingService(
      caregiverRepo,
      assignmentRepo,
      scheduleRepo,
      attendanceRepo,
      exceptionRepo,
      eventRepo,
      scopeService,
      auditService,
      userContext,
    );
  });

  describe('selfServiceMark', () => {
    beforeEach(() => {
      caregiverRepo.findByIdentity.mockResolvedValue(activeCaregiver);
      assignmentRepo.findActiveByCaregiverAndDate.mockResolvedValue(
        activeAssignment,
      );
      scheduleRepo.findActiveByHallAndDate.mockResolvedValue(activeSchedule);
      attendanceRepo.existsOfficialMark.mockResolvedValue(false);
      attendanceRepo.save.mockImplementation(async (r) => r);
    });

    it('creates an official mark when all conditions are met', async () => {
      const result = await service.selfServiceMark({
        documentNumber: '12345678',
        localDate: '2025-01-06',
        entryTime: '08:05',
      });

      expect(result.markKind).toBe('official');
      expect(result.caregiverId).toBe(CGV_ID);
      expect(result.entryTime).toBe('08:05');
    });

    it('rejects retired caregivers and records an event', async () => {
      caregiverRepo.findByIdentity.mockResolvedValue(
        CaregiverMother.fromPrimitives({
          id: CGV_ID,
          documentType: 'DNI',
          documentNumber: '12345678',
          firstName: 'Maria',
          lastName: 'Gonzalez',
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-01-05'),
          status: 'retired',
        }),
      );

      await expect(
        service.selfServiceMark({
          documentNumber: '12345678',
          localDate: '2025-01-06',
          entryTime: '08:05',
        }),
      ).rejects.toThrow(BadRequestException);
      expect(eventRepo.save).toHaveBeenCalled();
    });

    it('rejects out-of-window marks and records an event', async () => {
      await expect(
        service.selfServiceMark({
          documentNumber: '12345678',
          localDate: '2025-01-06',
          entryTime: '08:35',
        }),
      ).rejects.toThrow(BadRequestException);
      expect(attendanceRepo.save).not.toHaveBeenCalled();
      expect(eventRepo.save).toHaveBeenCalled();
    });

    it('rejects duplicate official marks and records an event', async () => {
      attendanceRepo.existsOfficialMark.mockResolvedValue(true);

      await expect(
        service.selfServiceMark({
          documentNumber: '12345678',
          localDate: '2025-01-06',
          entryTime: '08:05',
        }),
      ).rejects.toThrow(BadRequestException);
      expect(attendanceRepo.save).not.toHaveBeenCalled();
      expect(eventRepo.save).toHaveBeenCalled();
    });
  });

  describe('assistedMark', () => {
    it('creates a special mark and records an audit event', async () => {
      caregiverRepo.findByIdentity.mockResolvedValue(activeCaregiver);
      assignmentRepo.findActiveByCaregiverAndDate.mockResolvedValue(
        activeAssignment,
      );

      const result = await service.assistedMark(
        {
          caregiverId: CGV_ID,
          localDate: '2025-01-06',
          blockId: BLOCK_ID,
          entryTime: '09:00',
          reason: 'System outage',
        },
        ['admin'],
      );

      expect(result.markKind).toBe('special');
      expect(auditService.record).toHaveBeenCalled();
    });
  });

  describe('correctMark', () => {
    it('voids the original mark and creates a corrected one', async () => {
      const original = CaregiverAttendanceRecord.createOfficial({
        caregiverId: CGV_ID,
        communityHallId: HALL_ID,
        localDate: '2025-01-06',
        blockId: BLOCK_ID,
        entryTime: '08:05',
        source: 'self-service',
      });
      attendanceRepo.findById.mockResolvedValue(original);
      attendanceRepo.voidMark.mockResolvedValue(original.void());
      attendanceRepo.save.mockImplementation(async (r) => r);

      const result = await service.correctMark(
        original.id!,
        { entryTime: '08:10', reason: 'Typo' },
        ['admin'],
      );

      expect(attendanceRepo.voidMark).toHaveBeenCalledWith(original.id);
      expect(result.markKind).toBe('corrected');
      expect(result.entryTime).toBe('08:10');
      expect(auditService.record).toHaveBeenCalled();
    });
  });
});
