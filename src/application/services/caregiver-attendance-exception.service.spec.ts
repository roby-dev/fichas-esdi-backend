import { CaregiverAttendanceExceptionService } from './caregiver-attendance-exception.service';
import { CaregiverAttendanceExceptionRepository } from 'src/domain/repositories/caregiver-attendance-exception.repository';
import { CaregiverAttendanceScopeService } from './caregiver-attendance-scope.service';
import { CaregiverAttendanceException } from 'src/domain/entities/caregiver-attendance-exception.entity';
import { CreateExceptionDto } from '../dtos/caregiver-attendance/create-exception.dto';

const HALL_ID = '00000000000000000000000a';
const CGV_ID = '000000000000000000000001';

describe('CaregiverAttendanceExceptionService', () => {
  let service: CaregiverAttendanceExceptionService;
  let exceptionRepo: jest.Mocked<CaregiverAttendanceExceptionRepository>;
  let scopeService: jest.Mocked<CaregiverAttendanceScopeService>;

  beforeEach(() => {
    exceptionRepo = {
      save: jest.fn(),
      findByHallAndDate: jest.fn(),
      findByCaregiverAndDate: jest.fn(),
    } as unknown as jest.Mocked<CaregiverAttendanceExceptionRepository>;

    scopeService = {
      ensureCanManageHall: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<CaregiverAttendanceScopeService>;

    service = new CaregiverAttendanceExceptionService(
      exceptionRepo,
      scopeService,
    );
  });

  describe('create', () => {
    it('creates a hall holiday exception', async () => {
      exceptionRepo.save.mockImplementation(async (e) => e);

      const dto: CreateExceptionDto = {
        scope: 'hall',
        communityHallId: HALL_ID,
        localDate: '2025-01-06',
        kind: 'holiday',
        reason: 'National holiday',
      };

      const result = await service.create(dto, ['admin']);

      expect(result.scope).toBe('hall');
      expect(result.kind).toBe('holiday');
      expect(result.communityHallId).toBe(HALL_ID);
    });

    it('creates a caregiver justification exception', async () => {
      exceptionRepo.save.mockImplementation(async (e) => e);

      const dto: CreateExceptionDto = {
        scope: 'caregiver',
        caregiverId: CGV_ID,
        localDate: '2025-01-06',
        blockId: 'block-1',
        kind: 'justification',
        reason: 'Medical leave',
      };

      const result = await service.create(dto, ['admin']);

      expect(result.scope).toBe('caregiver');
      expect(result.kind).toBe('justification');
      expect(result.caregiverId).toBe(CGV_ID);
    });
  });

  describe('findByHallAndDate', () => {
    it('returns exceptions scoped to the hall and date', async () => {
      exceptionRepo.findByHallAndDate.mockResolvedValue([
        CaregiverAttendanceException.hallHoliday({
          communityHallId: HALL_ID,
          localDate: '2025-01-06',
          reason: 'Holiday',
        }),
      ]);

      const result = await service.findByHallAndDate(HALL_ID, '2025-01-06', [
        'admin',
      ]);

      expect(result).toHaveLength(1);
    });
  });
});
