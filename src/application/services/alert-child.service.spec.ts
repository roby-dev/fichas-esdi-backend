/**
 * AlertChildService now reads from the unified `children` collection via
 * ChildRepository (not the frozen alert_children), and maps to the legacy
 * AlertChildResponseDto shape so the frontend keeps consuming /alert-child.
 */
import { AlertChildService } from './alert-child.service';
import type { ChildRepository } from 'src/domain/repositories/child.repository';
import { Child } from 'src/domain/entities/child.entity';

describe('AlertChildService (reads from children)', () => {
  let service: AlertChildService;
  let childRepo: jest.Mocked<ChildRepository>;

  const formChild = Child.fromPrimitives({
    id: 'c1',
    documentNumber: '11111111',
    firstName: 'ANA',
    lastName: 'LOPEZ',
    fullName: 'ANA LOPEZ',
    birthday: new Date('2022-01-01'),
    admissionDate: new Date('2025-01-01'),
    communityHallId: 'hall-1',
    communityHallName: 'Salón A',
    managementCommitteCode: 'C-001',
    managementCommitteName: 'Comité A',
    // form children have no gender/childCode
  });

  beforeEach(() => {
    childRepo = {
      findAllUnpaginated: jest.fn().mockResolvedValue([formChild]),
      findAllByManagementCommitteCode: jest.fn().mockResolvedValue([formChild]),
    } as unknown as jest.Mocked<ChildRepository>;

    service = new AlertChildService(childRepo);
  });

  it('findAllByCurrentUserAndCommitteeCode queries by management committee code', async () => {
    await service.findAllByCurrentUserAndCommitteeCode('C-001');

    expect(childRepo.findAllByManagementCommitteCode).toHaveBeenCalledWith(
      'C-001',
    );
  });

  it('maps a form child to the alert-child shape, degrading Excel-only fields to ""', async () => {
    const [dto] = await service.findAllByCurrentUserAndCommitteeCode('C-001');

    expect(dto.fullName).toBe('ANA LOPEZ');
    expect(dto.communityHallName).toBe('Salón A');
    expect(dto.managementCommitteCode).toBe('C-001');
    expect(dto.gender).toBe('');
    expect(dto.childCode).toBe('');
    // signal fields are computed from birthday
    expect(typeof dto.ageInMonths).toBe('number');
    expect(typeof dto.activeAlertSignal).toBe('string');
  });

  it('findAllByCurrentUser reads the full unpaginated roster', async () => {
    await service.findAllByCurrentUser();

    expect(childRepo.findAllUnpaginated).toHaveBeenCalledTimes(1);
  });
});
