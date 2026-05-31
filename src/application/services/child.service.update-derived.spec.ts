/**
 * Tests for ChildService.update — committee denormalization on edit.
 *
 * The community hall can change on edit, which can move the child to a
 * different committee. update() must re-resolve the hall and re-derive the
 * committee descriptors so the denormalized fields never drift out of sync.
 */
import { ChildService } from './child.service';
import type { ChildRepository } from 'src/domain/repositories/child.repository';
import type { CommunityHallRepository } from 'src/domain/repositories/community-hall.repository';
import type { CommitteeRepository } from 'src/domain/repositories/committee.repository';
import type { UserRepository } from 'src/domain/repositories/user.repository';
import { RequestUserContext } from 'src/common/contexts/user-context.service';
import { Child } from 'src/domain/entities/child.entity';
import { CommunityHall } from 'src/domain/entities/community-hall.entity';
import { Committee } from 'src/domain/entities/committee.entity';
import { NotFoundException } from 'src/domain/exceptions';
import { UpdateChildDto } from '../dtos/child/update-child.dto';
import { AuditService } from './audit.service';

describe('ChildService.update — committee re-derivation', () => {
  let service: ChildService;
  let childRepo: jest.Mocked<ChildRepository>;
  let hallRepo: jest.Mocked<CommunityHallRepository>;
  let committeeRepo: jest.Mocked<CommitteeRepository>;
  let userRepo: jest.Mocked<UserRepository>;
  let userContext: jest.Mocked<RequestUserContext>;
  let auditService: jest.Mocked<AuditService>;

  const CHILD_ID = 'childId-001';
  const NEW_HALL_ID = 'hallId-new';

  // The child currently lives in committee A; the edit moves it to hall in B.
  const existingChild = Child.fromPrimitives({
    id: CHILD_ID,
    documentNumber: '12345678',
    firstName: 'OLD',
    lastName: 'NAME',
    birthday: new Date('2021-01-01'),
    admissionDate: new Date('2025-01-01'),
    communityHallId: 'hallId-old',
    communityHallName: 'Salón A',
    managementCommitteCode: 'C-AAA',
    managementCommitteName: 'Comité A',
  });

  const newHall = new CommunityHall(
    'LOC-B',
    'Salón B',
    'committeeRef-B',
    NEW_HALL_ID,
  );

  const committeeB = Committee.fromPrimitives({
    id: 'committeeRef-B',
    committeeId: 'C-BBB',
    name: 'Comité B',
  });

  const dto: UpdateChildDto = {
    documentNumber: '12345678',
    firstName: 'JUAN',
    lastName: 'PEREZ',
    birthday: new Date('2021-01-01'),
    admissionDate: new Date('2025-01-01'),
    communityHallId: NEW_HALL_ID,
  };

  beforeEach(() => {
    childRepo = {
      save: jest.fn(),
      update: jest.fn().mockImplementation(async (c: Child) => c),
      findById: jest.fn().mockResolvedValue(existingChild),
      findAll: jest.fn(),
      findAllUnpaginated: jest.fn(),
      delete: jest.fn(),
      findByDocumentNumber: jest.fn(),
      findByDocumentNumberAndCommunnityHallId: jest.fn(),
      findAlllByUser: jest.fn(),
      findAllByCommittee: jest.fn(),
      findAllByManagementCommitteCode: jest.fn(),
      findAllGroupedByUser: jest.fn(),
      upsertByDni: jest.fn(),
    } as unknown as jest.Mocked<ChildRepository>;

    hallRepo = {
      findById: jest.fn().mockResolvedValue(newHall),
    } as unknown as jest.Mocked<CommunityHallRepository>;

    committeeRepo = {
      findById: jest.fn().mockResolvedValue(committeeB),
    } as unknown as jest.Mocked<CommitteeRepository>;

    userRepo = {} as unknown as jest.Mocked<UserRepository>;
    userContext = {
      getUserId: jest.fn().mockReturnValue('user-1'),
    } as unknown as jest.Mocked<RequestUserContext>;
    auditService = {
      record: jest.fn().mockResolvedValue(undefined),
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

  it('re-derives committee code/name from the NEW hall and persists them', async () => {
    await service.update(CHILD_ID, dto);

    const updatedArg: Child = childRepo.update.mock.calls[0][0];
    expect(updatedArg.communityHallId).toBe(NEW_HALL_ID);
    expect(updatedArg.communityHallName).toBe('Salón B');
    expect(updatedArg.managementCommitteCode).toBe('C-BBB');
    expect(updatedArg.managementCommitteName).toBe('Comité B');
  });

  it('recomputes fullName from the updated names', async () => {
    await service.update(CHILD_ID, dto);

    const updatedArg: Child = childRepo.update.mock.calls[0][0];
    expect(updatedArg.fullName).toBe('JUAN PEREZ');
  });

  it('throws NotFoundException when the new hall does not exist', async () => {
    hallRepo.findById.mockResolvedValue(null);

    await expect(service.update(CHILD_ID, dto)).rejects.toThrow(
      NotFoundException,
    );
    expect(childRepo.update).not.toHaveBeenCalled();
  });
});
