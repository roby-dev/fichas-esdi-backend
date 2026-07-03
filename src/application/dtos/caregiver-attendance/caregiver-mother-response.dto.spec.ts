import { CaregiverMother } from 'src/domain/entities/caregiver-mother.entity';
import { CaregiverMotherResponseDto } from './caregiver-mother-response.dto';

describe('CaregiverMotherResponseDto', () => {
  const caregiver = CaregiverMother.fromPrimitives({
    id: 'caregiver-1',
    documentType: 'DNI',
    documentNumber: '12345678',
    firstName: 'Maria',
    lastName: 'Gonzalez',
    fullName: 'Maria Gonzalez',
    startDate: new Date('2026-07-01'),
    endDate: null,
    status: 'active',
  });

  it('includes current hall fields when hall metadata is provided', () => {
    const result = CaregiverMotherResponseDto.fromDomain(caregiver, {
      id: 'hall-1',
      name: 'Local Las Flores',
    });

    expect(result.currentHallId).toBe('hall-1');
    expect(result.currentHallName).toBe('Local Las Flores');
  });

  it('keeps current hall fields nullable when hall metadata is omitted', () => {
    const result = CaregiverMotherResponseDto.fromDomain(caregiver);

    expect(result.currentHallId).toBeNull();
    expect(result.currentHallName).toBeNull();
  });
});
