import { ChildService } from './child.service';
import type { ChildRepository } from 'src/domain/repositories/child.repository';
import type { CommunityHallRepository } from 'src/domain/repositories/community-hall.repository';
import type { CommitteeRepository } from 'src/domain/repositories/committee.repository';
import type { UserRepository } from 'src/domain/repositories/user.repository';
import { RequestUserContext } from 'src/common/contexts/user-context.service';
import { Child } from 'src/domain/entities/child.entity';
import { CommunityHall } from 'src/domain/entities/community-hall.entity';
import { Committee } from 'src/domain/entities/committee.entity';
import { ConflictException, NotFoundException } from 'src/domain/exceptions';
import { CreateChildDto } from '../dtos/child/create-child.dto';
import { AuditService } from './audit.service';

describe('ChildService.create', () => {
  let service: ChildService;
  let childRepo: jest.Mocked<ChildRepository>;
  let hallRepo: jest.Mocked<CommunityHallRepository>;
  let committeeRepo: jest.Mocked<CommitteeRepository>;
  let userRepo: jest.Mocked<UserRepository>;
  let userContext: jest.Mocked<RequestUserContext>;
  let auditService: jest.Mocked<AuditService>;

  const HALL_ID = 'hallId-123';
  const USER_ID = 'userId-456';
  const COMMITTEE_REF = 'committeeId-789';

  const mockHall = new CommunityHall(
    'LOC-001',
    'Salón Comunal A',
    COMMITTEE_REF,
    HALL_ID,
  );

  const mockCommittee = Committee.fromPrimitives({
    id: COMMITTEE_REF,
    committeeId: 'C-001',
    name: 'Comité Central',
  });

  const mockDto: CreateChildDto = {
    documentNumber: '12345678',
    firstName: 'JUAN',
    lastName: 'PÉREZ',
    birthday: '2021-03-15',
    admissionDate: '2025-08-01',
    communityHallId: HALL_ID,
  };

  const buildSavedChild = (overrides: Partial<{ id: string }> = {}) =>
    Child.fromPrimitives({
      id: overrides.id ?? 'childId-001',
      documentNumber: mockDto.documentNumber,
      firstName: mockDto.firstName,
      lastName: mockDto.lastName,
      birthday: new Date(mockDto.birthday),
      admissionDate: new Date(mockDto.admissionDate),
      communityHallId: HALL_ID,
      userId: USER_ID,
      communityHall: mockHall,
    });

  beforeEach(() => {
    childRepo = {
      save: jest.fn(),
      update: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      findAllUnpaginated: jest.fn(),
      delete: jest.fn(),
      findByDocumentNumber: jest.fn(),
      findByDocumentNumberAndCommunnityHallId: jest.fn(),
      findAlllByUser: jest.fn(),
      findAllByCommittee: jest.fn(),
      findAllGroupedByUser: jest.fn(),
      upsertByDni: jest.fn(),
    } as unknown as jest.Mocked<ChildRepository>;

    hallRepo = {
      save: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findByNameAndCommitteeId: jest.fn(),
      findAllByCommitteeId: jest.fn(),
    } as unknown as jest.Mocked<CommunityHallRepository>;

    committeeRepo = {
      save: jest.fn(),
      findById: jest.fn().mockResolvedValue(mockCommittee),
      findAll: jest.fn(),
      findAllUnpaginated: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findByCommitteeId: jest.fn(),
    } as unknown as jest.Mocked<CommitteeRepository>;

    userRepo = {
      save: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
      findByEmail: jest.fn(),
    } as unknown as jest.Mocked<UserRepository>;

    userContext = {
      getUserId: jest.fn().mockReturnValue(USER_ID),
    } as unknown as jest.Mocked<RequestUserContext>;

    auditService = {
      record: jest.fn().mockResolvedValue(undefined),
      recordMany: jest.fn().mockResolvedValue([]),
      query: jest.fn(),
    } as unknown as jest.Mocked<AuditService>;

    service = new ChildService(
      childRepo,
      hallRepo,
      committeeRepo,
      userRepo,
      userContext,
      auditService,
    );
  });

  describe('happy path', () => {
    beforeEach(() => {
      hallRepo.findById.mockResolvedValue(mockHall);
      committeeRepo.findById.mockResolvedValue(mockCommittee);
      // Phase 3: global DNI check via findByDocumentNumber
      childRepo.findByDocumentNumber.mockResolvedValue(null);
      childRepo.save.mockResolvedValue(buildSavedChild());
    });

    it('should denormalize hall name and committee code/name onto the saved child', async () => {
      await service.create(mockDto);

      const savedArg: Child = childRepo.save.mock.calls[0][0];
      expect(savedArg.communityHallName).toBe('Salón Comunal A');
      expect(savedArg.managementCommitteCode).toBe('C-001');
      expect(savedArg.managementCommitteName).toBe('Comité Central');
    });

    it('should return a ChildResponseDto with the correct data', async () => {
      const result = await service.create(mockDto);

      expect(result.id).toBe('childId-001');
      expect(result.documentNumber).toBe(mockDto.documentNumber);
      expect(result.firstName).toBe(mockDto.firstName);
      expect(result.lastName).toBe(mockDto.lastName);
    });

    it('should call childRepo.save with the child entity built from the DTO', async () => {
      await service.create(mockDto);

      expect(childRepo.save).toHaveBeenCalledTimes(1);
      expect(childRepo.save).toHaveBeenCalledWith(
        expect.objectContaining({
          documentNumber: mockDto.documentNumber,
          firstName: mockDto.firstName,
          lastName: mockDto.lastName,
        }),
      );
    });

    it('should resolve the userId from userContext', async () => {
      await service.create(mockDto);

      expect(userContext.getUserId).toHaveBeenCalled();
    });

    it('should check duplicates using global document number (not scoped by hall)', async () => {
      await service.create(mockDto);

      // Phase 3: global DNI check
      expect(childRepo.findByDocumentNumber).toHaveBeenCalledWith(
        mockDto.documentNumber,
      );
      // deprecated scoped method must NOT be called
      expect(
        childRepo.findByDocumentNumberAndCommunnityHallId,
      ).not.toHaveBeenCalled();
    });

    it('should record an audit event for the creation with after snapshot and null before', async () => {
      await service.create(mockDto);

      expect(auditService.record).toHaveBeenCalledTimes(1);
      expect(auditService.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'child.create',
          entityType: 'Child',
          entityId: 'childId-001',
          before: null,
          after: expect.objectContaining({
            documentNumber: mockDto.documentNumber,
            firstName: mockDto.firstName,
            lastName: mockDto.lastName,
          }),
        }),
      );
    });
  });

  describe('when community hall does not exist', () => {
    beforeEach(() => {
      hallRepo.findById.mockResolvedValue(null);
    });

    it('should throw NotFoundException', async () => {
      await expect(service.create(mockDto)).rejects.toThrow(NotFoundException);
    });

    it('should include the hall ID in the error message', async () => {
      await expect(service.create(mockDto)).rejects.toThrow(
        `No existe un local comunal con Id ${HALL_ID}`,
      );
    });

    it('should not attempt to save the child', async () => {
      await expect(service.create(mockDto)).rejects.toThrow();
      expect(childRepo.save).not.toHaveBeenCalled();
    });

    it('should not record an audit event when validation fails', async () => {
      await expect(service.create(mockDto)).rejects.toThrow();
      expect(auditService.record).not.toHaveBeenCalled();
    });
  });

  describe('when child DNI already exists globally (Phase 3 global check)', () => {
    beforeEach(() => {
      hallRepo.findById.mockResolvedValue(mockHall);
      // Phase 3: global DNI duplicate — child exists in ANY hall
      childRepo.findByDocumentNumber.mockResolvedValue(
        Child.fromPrimitives({
          id: 'existingId',
          documentNumber: mockDto.documentNumber,
          firstName: 'EXISTING',
          lastName: 'CHILD',
          birthday: new Date('2021-01-01'),
          admissionDate: new Date('2025-06-01'),
          communityHallId: 'SOME-OTHER-HALL',
          userId: USER_ID,
        }),
      );
    });

    it('should throw ConflictException', async () => {
      await expect(service.create(mockDto)).rejects.toThrow(ConflictException);
    });

    it('should include the DNI in the error message', async () => {
      await expect(service.create(mockDto)).rejects.toThrow(
        mockDto.documentNumber,
      );
    });

    it('should not attempt to save the child', async () => {
      await expect(service.create(mockDto)).rejects.toThrow();
      expect(childRepo.save).not.toHaveBeenCalled();
    });

    it('should not record an audit event when a duplicate is detected', async () => {
      await expect(service.create(mockDto)).rejects.toThrow();
      expect(auditService.record).not.toHaveBeenCalled();
    });
  });
});
