/**
 * Tests for the Phase-3 changes to ChildService.create:
 *   - global DNI duplicate check (findByDocumentNumber, not scoped by hall)
 *   - fullName concatenation stored at persistence
 *   - birthdayImported / admissionDateImported set to null for form-originated children
 */
import { ChildService } from './child.service';
import type { ChildRepository } from 'src/domain/repositories/child.repository';
import type { CommunityHallRepository } from 'src/domain/repositories/community-hall.repository';
import type { UserRepository } from 'src/domain/repositories/user.repository';
import { RequestUserContext } from 'src/common/contexts/user-context.service';
import { Child } from 'src/domain/entities/child.entity';
import { CommunityHall } from 'src/domain/entities/community-hall.entity';
import { ConflictException } from 'src/domain/exceptions';
import { CreateChildDto } from '../dtos/child/create-child.dto';
import { AuditService } from './audit.service';

describe('ChildService.create — Phase 3 DNI behaviour', () => {
  let service: ChildService;
  let childRepo: jest.Mocked<ChildRepository>;
  let hallRepo: jest.Mocked<CommunityHallRepository>;
  let userRepo: jest.Mocked<UserRepository>;
  let userContext: jest.Mocked<RequestUserContext>;
  let auditService: jest.Mocked<AuditService>;

  const HALL_ID = 'hallId-abc';
  const USER_ID = 'userId-xyz';

  const mockHall = new CommunityHall(
    'LOC-002',
    'Salón B',
    'committeeRef-999',
    HALL_ID,
  );

  const mockDto: CreateChildDto = {
    documentNumber: '12345678',
    firstName: 'ROSA',
    lastName: 'FLORES',
    birthday: '2020-01-10',
    admissionDate: '2025-06-01',
    communityHallId: HALL_ID,
  };

  const buildSavedChild = () =>
    Child.fromPrimitives({
      id: 'childId-999',
      documentNumber: mockDto.documentNumber,
      firstName: mockDto.firstName,
      lastName: mockDto.lastName,
      fullName: `${mockDto.firstName} ${mockDto.lastName}`,
      birthday: new Date(mockDto.birthday),
      admissionDate: new Date(mockDto.admissionDate),
      birthdayImported: null,
      admissionDateImported: null,
      communityHallId: HALL_ID,
      userId: USER_ID,
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
      findAllUnpaginated: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findByNameAndCommitteeRef: jest.fn(),
      findAllByCommitteeRef: jest.fn(),
      findByLocalId: jest.fn(),
    } as unknown as jest.Mocked<CommunityHallRepository>;

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
      userRepo,
      userContext,
      auditService,
    );
  });

  describe('global DNI duplicate check', () => {
    it('should use findByDocumentNumber (global) to check for duplicates', async () => {
      hallRepo.findById.mockResolvedValue(mockHall);
      childRepo.findByDocumentNumber.mockResolvedValue(null);
      childRepo.save.mockResolvedValue(buildSavedChild());

      await service.create(mockDto);

      expect(childRepo.findByDocumentNumber).toHaveBeenCalledWith(
        mockDto.documentNumber,
      );
    });

    it('should throw ConflictException when DNI already exists globally (different hall)', async () => {
      const existingInDifferentHall = Child.fromPrimitives({
        id: 'otherChildId',
        documentNumber: mockDto.documentNumber,
        firstName: 'OTRO',
        lastName: 'NOMBRE',
        birthday: new Date('2020-05-05'),
        admissionDate: new Date('2025-01-01'),
        communityHallId: 'DIFFERENT-HALL-ID',
        userId: USER_ID,
      });

      hallRepo.findById.mockResolvedValue(mockHall);
      childRepo.findByDocumentNumber.mockResolvedValue(existingInDifferentHall);

      await expect(service.create(mockDto)).rejects.toThrow(ConflictException);
    });

    it('should NOT call the deprecated findByDocumentNumberAndCommunnityHallId', async () => {
      hallRepo.findById.mockResolvedValue(mockHall);
      childRepo.findByDocumentNumber.mockResolvedValue(null);
      childRepo.save.mockResolvedValue(buildSavedChild());

      await service.create(mockDto);

      expect(
        childRepo.findByDocumentNumberAndCommunnityHallId,
      ).not.toHaveBeenCalled();
    });
  });

  describe('fullName concatenation', () => {
    it('should pass a child with fullName = firstName + space + lastName to save', async () => {
      hallRepo.findById.mockResolvedValue(mockHall);
      childRepo.findByDocumentNumber.mockResolvedValue(null);
      childRepo.save.mockResolvedValue(buildSavedChild());

      await service.create(mockDto);

      const savedArg: Child = childRepo.save.mock.calls[0][0];
      expect(savedArg.fullName).toBe('ROSA FLORES');
    });

    it('should trim leading/trailing whitespace from the concatenated fullName', async () => {
      const dto: CreateChildDto = {
        ...mockDto,
        firstName: '  ROSA  ',
        lastName: '  FLORES  ',
      };
      hallRepo.findById.mockResolvedValue(mockHall);
      childRepo.findByDocumentNumber.mockResolvedValue(null);
      childRepo.save.mockImplementation(async (c) => c);

      await service.create(dto);

      const savedArg: Child = childRepo.save.mock.calls[0][0];
      expect(savedArg.fullName).toBe('ROSA FLORES');
    });
  });

  describe('imported dates are null for form-originated children', () => {
    it('should set birthdayImported to null on the saved child', async () => {
      hallRepo.findById.mockResolvedValue(mockHall);
      childRepo.findByDocumentNumber.mockResolvedValue(null);
      childRepo.save.mockResolvedValue(buildSavedChild());

      await service.create(mockDto);

      const savedArg: Child = childRepo.save.mock.calls[0][0];
      expect(savedArg.birthdayImported).toBeNull();
    });

    it('should set admissionDateImported to null on the saved child', async () => {
      hallRepo.findById.mockResolvedValue(mockHall);
      childRepo.findByDocumentNumber.mockResolvedValue(null);
      childRepo.save.mockResolvedValue(buildSavedChild());

      await service.create(mockDto);

      const savedArg: Child = childRepo.save.mock.calls[0][0];
      expect(savedArg.admissionDateImported).toBeNull();
    });
  });
});
