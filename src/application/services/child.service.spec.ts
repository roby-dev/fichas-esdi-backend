import { ChildService } from './child.service';
import type { ChildRepository } from 'src/domain/repositories/child.repository';
import type { CommunityHallRepository } from 'src/domain/repositories/community-hall.repository';
import type { UserRepository } from 'src/domain/repositories/user.repository';
import { RequestUserContext } from 'src/common/contexts/user-context.service';
import { Child } from 'src/domain/entities/child.entity';
import { CommunityHall } from 'src/domain/entities/community-hall.entity';
import { ConflictException, NotFoundException } from 'src/domain/exceptions';
import { CreateChildDto } from '../dtos/child/create-child.dto';

describe('ChildService.create', () => {
  let service: ChildService;
  let childRepo: jest.Mocked<ChildRepository>;
  let hallRepo: jest.Mocked<CommunityHallRepository>;
  let userRepo: jest.Mocked<UserRepository>;
  let userContext: jest.Mocked<RequestUserContext>;

  const HALL_ID = 'hallId-123';
  const USER_ID = 'userId-456';

  const mockHall = new CommunityHall(
    'LOC-001',
    'Salón Comunal A',
    'committeeId-789',
    HALL_ID,
  );

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
      delete: jest.fn(),
      findByDocumentNumber: jest.fn(),
      findByDocumentNumberAndCommunnityHallId: jest.fn(),
      findAlllByUser: jest.fn(),
      findAllByCommittee: jest.fn(),
      findAllGroupedByUser: jest.fn(),
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

    service = new ChildService(childRepo, hallRepo, userRepo, userContext);
  });

  describe('happy path', () => {
    beforeEach(() => {
      hallRepo.findById.mockResolvedValue(mockHall);
      childRepo.findByDocumentNumberAndCommunnityHallId.mockResolvedValue(null);
      childRepo.save.mockResolvedValue(buildSavedChild());
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

    it('should check duplicates using document number and hall ID', async () => {
      await service.create(mockDto);

      expect(
        childRepo.findByDocumentNumberAndCommunnityHallId,
      ).toHaveBeenCalledWith(mockDto.documentNumber, HALL_ID);
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
  });

  describe('when child is already registered in that hall', () => {
    beforeEach(() => {
      hallRepo.findById.mockResolvedValue(mockHall);
      childRepo.findByDocumentNumberAndCommunnityHallId.mockResolvedValue(
        Child.fromPrimitives({
          id: 'existingId',
          documentNumber: mockDto.documentNumber,
          firstName: 'EXISTING',
          lastName: 'CHILD',
          birthday: new Date('2021-01-01'),
          admissionDate: new Date('2025-06-01'),
          communityHallId: HALL_ID,
          userId: USER_ID,
        }),
      );
    });

    it('should throw ConflictException', async () => {
      await expect(service.create(mockDto)).rejects.toThrow(ConflictException);
    });

    it('should include the hall name in the error message', async () => {
      await expect(service.create(mockDto)).rejects.toThrow(mockHall.name);
    });

    it('should not attempt to save the child', async () => {
      await expect(service.create(mockDto)).rejects.toThrow();
      expect(childRepo.save).not.toHaveBeenCalled();
    });
  });
});
