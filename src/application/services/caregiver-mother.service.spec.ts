import { CaregiverMotherService } from './caregiver-mother.service';
import { CaregiverMotherRepository } from 'src/domain/repositories/caregiver-mother.repository';
import { CaregiverHallAssignmentRepository } from 'src/domain/repositories/caregiver-hall-assignment.repository';
import { CommunityHallRepository } from 'src/domain/repositories/community-hall.repository';
import { CaregiverAttendanceScopeService } from './caregiver-attendance-scope.service';
import { RequestUserContext } from 'src/common/contexts/user-context.service';
import { CaregiverMother } from 'src/domain/entities/caregiver-mother.entity';
import { CaregiverHallAssignment } from 'src/domain/entities/caregiver-hall-assignment.entity';
import {
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from 'src/domain/exceptions';
import { CreateCaregiverMotherDto } from '../dtos/caregiver-attendance/create-caregiver-mother.dto';
import { CommunityHall } from 'src/domain/entities/community-hall.entity';

describe('CaregiverMotherService', () => {
  let service: CaregiverMotherService;
  let caregiverRepo: jest.Mocked<CaregiverMotherRepository>;
  let assignmentRepo: jest.Mocked<CaregiverHallAssignmentRepository>;
  let hallRepo: jest.Mocked<CommunityHallRepository>;
  let scopeService: jest.Mocked<CaregiverAttendanceScopeService>;
  let userContext: jest.Mocked<RequestUserContext>;

  const HALL_ID = '00000000000000000000000a';
  const CGV_ID = '000000000000000000000001';

  beforeEach(() => {
    caregiverRepo = {
      save: jest.fn(),
      update: jest.fn(),
      findById: jest.fn(),
      findByIdentity: jest.fn(),
      findAll: jest.fn(),
      findByIds: jest.fn(),
      existsByIdentity: jest.fn(),
      delete: jest.fn(),
    } as unknown as jest.Mocked<CaregiverMotherRepository>;

    assignmentRepo = {
      save: jest.fn(),
      findById: jest.fn(),
      findByCaregiverId: jest.fn(),
      findActiveByCaregiverAndDate: jest.fn(),
      closeCurrentAssignment: jest.fn(),
      findByHallIds: jest.fn(),
    } as unknown as jest.Mocked<CaregiverHallAssignmentRepository>;

    hallRepo = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<CommunityHallRepository>;

    scopeService = {
      ensureCanManageHall: jest.fn().mockResolvedValue(undefined),
      getAccessibleHallIds: jest.fn(),
    } as unknown as jest.Mocked<CaregiverAttendanceScopeService>;

    userContext = {
      getUserId: jest.fn().mockReturnValue('user-1'),
    } as unknown as jest.Mocked<RequestUserContext>;

    service = new CaregiverMotherService(
      caregiverRepo,
      assignmentRepo,
      hallRepo,
      scopeService,
      userContext,
    );
  });

  describe('create', () => {
    it('creates a caregiver with default document type DNI', async () => {
      caregiverRepo.existsByIdentity.mockResolvedValue(false);
      caregiverRepo.save.mockImplementation(async (c) =>
        CaregiverMother.fromPrimitives({
          ...c.toPrimitives(),
          id: CGV_ID,
        }),
      );

      const dto: CreateCaregiverMotherDto = {
        documentNumber: '12345678',
        firstName: 'Maria',
        lastName: 'Gonzalez',
        startDate: '2025-01-01',
      };

      const result = await service.create(dto, ['admin']);

      expect(result.documentType).toBe('DNI');
      expect(caregiverRepo.save).toHaveBeenCalledTimes(1);
    });

    it('throws ConflictException when identity already exists', async () => {
      caregiverRepo.existsByIdentity.mockResolvedValue(true);

      await expect(
        service.create(
          {
            documentNumber: '12345678',
            firstName: 'Maria',
            lastName: 'Gonzalez',
            startDate: '2025-01-01',
          },
          ['admin'],
        ),
      ).rejects.toThrow(ConflictException);

      expect(caregiverRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('transfer', () => {
    it('closes the current assignment and creates a new one', async () => {
      caregiverRepo.findById.mockResolvedValue(
        CaregiverMother.fromPrimitives({
          id: CGV_ID,
          documentType: 'DNI',
          documentNumber: '12345678',
          firstName: 'Maria',
          lastName: 'Gonzalez',
          startDate: new Date('2025-01-01'),
          status: 'active',
        }),
      );
      hallRepo.findById.mockResolvedValue(
        new CommunityHall('LOC-002', 'Hall B', 'committee-2', HALL_ID),
      );
      assignmentRepo.findActiveByCaregiverAndDate.mockResolvedValue(null);
      assignmentRepo.save.mockImplementation(async (a) => a);

      await service.transfer(
        CGV_ID,
        { communityHallId: HALL_ID, validFrom: '2025-07-01' },
        ['admin'],
      );

      expect(assignmentRepo.closeCurrentAssignment).toHaveBeenCalledWith(
        CGV_ID,
        expect.any(Date),
      );
      expect(assignmentRepo.save).toHaveBeenCalledTimes(1);
    });

    it('throws NotFoundException when caregiver does not exist', async () => {
      caregiverRepo.findById.mockResolvedValue(null);

      await expect(
        service.transfer(
          CGV_ID,
          { communityHallId: HALL_ID, validFrom: '2025-07-01' },
          ['admin'],
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('allows AT transfer when both source and destination halls are accessible', async () => {
      const sourceHallId = HALL_ID;
      caregiverRepo.findById.mockResolvedValue(
        CaregiverMother.fromPrimitives({
          id: CGV_ID,
          documentType: 'DNI',
          documentNumber: '12345678',
          firstName: 'Maria',
          lastName: 'Gonzalez',
          startDate: new Date('2025-01-01'),
          status: 'active',
        }),
      );
      hallRepo.findById.mockResolvedValue(
        new CommunityHall('LOC-002', 'Hall B', 'committee-2', HALL_ID),
      );
      assignmentRepo.findActiveByCaregiverAndDate.mockResolvedValue(
        CaregiverHallAssignment.fromPrimitives({
          id: 'assign-1',
          caregiverId: CGV_ID,
          communityHallId: sourceHallId,
          validFrom: new Date('2025-01-01'),
          validTo: null,
        }),
      );
      assignmentRepo.save.mockImplementation(async (a) => a);

      await service.transfer(
        CGV_ID,
        { communityHallId: HALL_ID, validFrom: '2025-07-01' },
        ['AT'],
      );

      expect(scopeService.ensureCanManageHall).toHaveBeenCalledWith(
        sourceHallId,
        ['AT'],
      );
      expect(assignmentRepo.closeCurrentAssignment).toHaveBeenCalled();
      expect(assignmentRepo.save).toHaveBeenCalledTimes(1);
    });

    it('denies AT transfer from a source hall outside scope', async () => {
      const sourceHallId = '00000000000000000000000b';
      caregiverRepo.findById.mockResolvedValue(
        CaregiverMother.fromPrimitives({
          id: CGV_ID,
          documentType: 'DNI',
          documentNumber: '12345678',
          firstName: 'Maria',
          lastName: 'Gonzalez',
          startDate: new Date('2025-01-01'),
          status: 'active',
        }),
      );
      hallRepo.findById.mockResolvedValue(
        new CommunityHall('LOC-002', 'Hall B', 'committee-2', HALL_ID),
      );
      assignmentRepo.findActiveByCaregiverAndDate.mockResolvedValue(
        CaregiverHallAssignment.fromPrimitives({
          id: 'assign-1',
          caregiverId: CGV_ID,
          communityHallId: sourceHallId,
          validFrom: new Date('2025-01-01'),
          validTo: null,
        }),
      );
      scopeService.ensureCanManageHall.mockImplementation(async (hallId) => {
        if (hallId === sourceHallId) {
          throw new UnauthorizedException('Fuera de alcance');
        }
      });

      await expect(
        service.transfer(
          CGV_ID,
          { communityHallId: HALL_ID, validFrom: '2025-07-01' },
          ['AT'],
        ),
      ).rejects.toThrow(UnauthorizedException);

      expect(scopeService.ensureCanManageHall).toHaveBeenCalledWith(
        sourceHallId,
        ['AT'],
      );
      expect(assignmentRepo.save).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('returns all caregivers for admin users', async () => {
      scopeService.getAccessibleHallIds.mockResolvedValue(null);
      caregiverRepo.findAll.mockResolvedValue([
        CaregiverMother.fromPrimitives({
          id: 'cgv-1',
          documentType: 'DNI',
          documentNumber: '12345678',
          firstName: 'Maria',
          lastName: 'Gonzalez',
          startDate: new Date('2025-01-01'),
          status: 'active',
        }),
      ]);

      const result = await service.findAll(['admin'], 10, 0);

      expect(result).toHaveLength(1);
      expect(caregiverRepo.findAll).toHaveBeenCalledWith(10, 0);
      expect(assignmentRepo.findByHallIds).not.toHaveBeenCalled();
    });

    it('returns only caregivers assigned to accessible halls for AT users', async () => {
      scopeService.getAccessibleHallIds.mockResolvedValue([HALL_ID]);
      assignmentRepo.findByHallIds.mockResolvedValue([
        CaregiverHallAssignment.fromPrimitives({
          id: 'assign-1',
          caregiverId: CGV_ID,
          communityHallId: HALL_ID,
          validFrom: new Date('2025-01-01'),
          validTo: null,
        }),
      ]);
      caregiverRepo.findByIds.mockResolvedValue([
        CaregiverMother.fromPrimitives({
          id: CGV_ID,
          documentType: 'DNI',
          documentNumber: '12345678',
          firstName: 'Maria',
          lastName: 'Gonzalez',
          startDate: new Date('2025-01-01'),
          status: 'active',
        }),
      ]);

      const result = await service.findAll(['AT'], 10, 0);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(CGV_ID);
      expect(assignmentRepo.findByHallIds).toHaveBeenCalledWith([HALL_ID]);
      expect(caregiverRepo.findByIds).toHaveBeenCalledWith([CGV_ID]);
    });

    it('returns an empty list for AT users with no accessible halls', async () => {
      scopeService.getAccessibleHallIds.mockResolvedValue([]);

      const result = await service.findAll(['AT'], 10, 0);

      expect(result).toEqual([]);
      expect(assignmentRepo.findByHallIds).not.toHaveBeenCalled();
      expect(caregiverRepo.findByIds).not.toHaveBeenCalled();
    });
  });

  describe('findAssignments', () => {
    it('returns all assignments for admin users', async () => {
      scopeService.getAccessibleHallIds.mockResolvedValue(null);
      assignmentRepo.findByCaregiverId.mockResolvedValue([
        CaregiverHallAssignment.fromPrimitives({
          id: 'assign-1',
          caregiverId: CGV_ID,
          communityHallId: HALL_ID,
          validFrom: new Date('2025-01-01'),
          validTo: null,
        }),
      ]);

      const result = await service.findAssignments(CGV_ID, ['admin']);

      expect(result).toHaveLength(1);
      expect(assignmentRepo.findByCaregiverId).toHaveBeenCalledWith(CGV_ID);
    });

    it('returns only assignments in accessible halls for AT users', async () => {
      scopeService.getAccessibleHallIds.mockResolvedValue([HALL_ID]);
      assignmentRepo.findByCaregiverId.mockResolvedValue([
        CaregiverHallAssignment.fromPrimitives({
          id: 'assign-1',
          caregiverId: CGV_ID,
          communityHallId: HALL_ID,
          validFrom: new Date('2025-01-01'),
          validTo: null,
        }),
        CaregiverHallAssignment.fromPrimitives({
          id: 'assign-2',
          caregiverId: CGV_ID,
          communityHallId: '00000000000000000000000b',
          validFrom: new Date('2025-03-01'),
          validTo: null,
        }),
      ]);

      const result = await service.findAssignments(CGV_ID, ['AT']);

      expect(result).toHaveLength(1);
      expect(result[0].communityHallId).toBe(HALL_ID);
    });

    it('denies AT users when no assignment is within scope', async () => {
      scopeService.getAccessibleHallIds.mockResolvedValue([
        '00000000000000000000000c',
      ]);
      assignmentRepo.findByCaregiverId.mockResolvedValue([
        CaregiverHallAssignment.fromPrimitives({
          id: 'assign-1',
          caregiverId: CGV_ID,
          communityHallId: HALL_ID,
          validFrom: new Date('2025-01-01'),
          validTo: null,
        }),
      ]);

      await expect(
        service.findAssignments(CGV_ID, ['AT']),
      ).rejects.toThrow(UnauthorizedException);
    });
  });
});
