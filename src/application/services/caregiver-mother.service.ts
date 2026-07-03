import { Inject, Injectable } from '@nestjs/common';
import {
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from 'src/domain/exceptions';
import {
  CAREGIVER_HALL_ASSIGNMENT_REPOSITORY,
  CAREGIVER_MOTHER_REPOSITORY,
  COMMUNITY_HALL_REPOSITORY,
} from 'src/domain/constants/tokens';
import { RequestUserContext } from 'src/common/contexts/user-context.service';
import { CaregiverMother } from 'src/domain/entities/caregiver-mother.entity';
import { CaregiverHallAssignment } from 'src/domain/entities/caregiver-hall-assignment.entity';

import type { CaregiverMotherRepository } from 'src/domain/repositories/caregiver-mother.repository';
import type { CaregiverHallAssignmentRepository } from 'src/domain/repositories/caregiver-hall-assignment.repository';
import type { CommunityHallRepository } from 'src/domain/repositories/community-hall.repository';
import { CaregiverMotherResponseDto } from '../dtos/caregiver-attendance/caregiver-mother-response.dto';
import { CreateCaregiverMotherDto } from '../dtos/caregiver-attendance/create-caregiver-mother.dto';
import { UpdateCaregiverMotherDto } from '../dtos/caregiver-attendance/update-caregiver-mother.dto';
import { TransferCaregiverMotherDto } from '../dtos/caregiver-attendance/transfer-caregiver-mother.dto';
import { CaregiverAttendanceScopeService } from './caregiver-attendance-scope.service';
import { addUtcDays } from 'src/common/utils/functions';

type CurrentHall = { id: string; name: string } | null;

@Injectable()
export class CaregiverMotherService {
  constructor(
    @Inject(CAREGIVER_MOTHER_REPOSITORY)
    private readonly caregiverRepository: CaregiverMotherRepository,
    @Inject(CAREGIVER_HALL_ASSIGNMENT_REPOSITORY)
    private readonly assignmentRepository: CaregiverHallAssignmentRepository,
    @Inject(COMMUNITY_HALL_REPOSITORY)
    private readonly hallRepository: CommunityHallRepository,
    private readonly scopeService: CaregiverAttendanceScopeService,
    private readonly userContext: RequestUserContext,
  ) {}

  async create(
    dto: CreateCaregiverMotherDto,
    roles: string[],
  ): Promise<CaregiverMotherResponseDto> {
    await this.scopeService.ensureCanManageHall(dto.communityHallId, roles);

    const hall = await this.hallRepository.findById(dto.communityHallId);
    if (!hall) {
      throw new NotFoundException(
        `No existe un local comunal con ID ${dto.communityHallId}`,
      );
    }

    const documentType = (dto.documentType ?? 'DNI').trim().toUpperCase();
    const documentNumber = dto.documentNumber.trim();

    const exists = await this.caregiverRepository.existsByIdentity(
      documentType,
      documentNumber,
    );
    if (exists) {
      throw new ConflictException(
        `Ya existe una cuidadora con ${documentType} ${documentNumber}`,
      );
    }

    const caregiver = CaregiverMother.create({
      documentType,
      documentNumber,
      firstName: dto.firstName,
      lastName: dto.lastName,
      phone: dto.phone,
      startDate: new Date(dto.startDate),
      endDate: dto.endDate ? new Date(dto.endDate) : null,
      status: dto.status ?? 'active',
    });

    const saved = await this.caregiverRepository.save(caregiver);

    try {
      const assignment = CaregiverHallAssignment.create({
        caregiverId: saved.id!,
        communityHallId: hall.id!,
        validFrom: new Date(dto.startDate),
      });
      await this.assignmentRepository.save(assignment);
    } catch (error) {
      await this.caregiverRepository.delete(saved.id!);
      throw error;
    }

    return CaregiverMotherResponseDto.fromDomain(saved);
  }

  async update(
    id: string,
    dto: UpdateCaregiverMotherDto,
    _roles: string[],
  ): Promise<CaregiverMotherResponseDto> {
    const existing = await this.findCaregiverOrThrow(id);

    const updated = CaregiverMother.fromPrimitives({
      ...existing.toPrimitives(),
      documentType: dto.documentType ?? existing.documentType,
      documentNumber: dto.documentNumber ?? existing.documentNumber,
      firstName: dto.firstName ?? existing.firstName,
      lastName: dto.lastName ?? existing.lastName,
      phone: dto.phone ?? existing.phone,
      startDate: dto.startDate ? new Date(dto.startDate) : existing.startDate,
      endDate: dto.endDate !== undefined
        ? (dto.endDate ? new Date(dto.endDate) : null)
        : dto.status === 'active'
          ? null
          : existing.endDate,
      status: dto.status ?? existing.status,
    });

    const saved = await this.caregiverRepository.update(updated);
    return CaregiverMotherResponseDto.fromDomain(saved);
  }

  async findById(
    id: string,
    _roles: string[],
  ): Promise<CaregiverMotherResponseDto> {
    const caregiver = await this.findCaregiverOrThrow(id);
    const currentHalls = await this.enrichWithCurrentHalls([caregiver]);
    return CaregiverMotherResponseDto.fromDomain(
      caregiver,
      currentHalls.get(caregiver.id!) ?? null,
    );
  }

  async findAll(
    roles: string[],
    limit = 10,
    offset = 0,
  ): Promise<CaregiverMotherResponseDto[]> {
    const accessibleHallIds =
      await this.scopeService.getAccessibleHallIds(roles);

    if (accessibleHallIds === null) {
      const caregivers = await this.caregiverRepository.findAll(limit, offset);
      const currentHalls = await this.enrichWithCurrentHalls(caregivers);
      return caregivers.map((caregiver) =>
        CaregiverMotherResponseDto.fromDomain(
          caregiver,
          currentHalls.get(caregiver.id!) ?? null,
        ),
      );
    }

    if (accessibleHallIds.length === 0) {
      return [];
    }

    const assignments = await this.assignmentRepository.findByHallIds(
      accessibleHallIds,
    );
    const caregiverIds = Array.from(
      new Set(assignments.map((a) => a.caregiverId)),
    ).slice(offset, offset + limit);

    if (caregiverIds.length === 0) {
      return [];
    }

    const caregivers = await this.caregiverRepository.findByIds(caregiverIds);
    const currentHalls = await this.enrichWithCurrentHalls(caregivers);
    return caregivers.map((caregiver) =>
      CaregiverMotherResponseDto.fromDomain(
        caregiver,
        currentHalls.get(caregiver.id!) ?? null,
      ),
    );
  }

  async transfer(
    id: string,
    dto: TransferCaregiverMotherDto,
    roles: string[],
  ): Promise<void> {
    await this.scopeService.ensureCanManageHall(dto.communityHallId, roles);

    const caregiver = await this.findCaregiverOrThrow(id);

    const currentAssignment =
      await this.assignmentRepository.findActiveByCaregiverAndDate(
        id,
        new Date(),
      );
    if (currentAssignment) {
      await this.scopeService.ensureCanManageHall(
        currentAssignment.communityHallId,
        roles,
      );
    }

    const hall = await this.hallRepository.findById(dto.communityHallId);
    if (!hall) {
      throw new NotFoundException(
        `No existe un local comunal con ID ${dto.communityHallId}`,
      );
    }

    const validFrom = new Date(dto.validFrom);
    const closeDate = addUtcDays(validFrom, -1);

    await this.assignmentRepository.closeCurrentAssignment(id, closeDate);

    const assignment = CaregiverHallAssignment.create({
      caregiverId: caregiver.id!,
      communityHallId: hall.id!,
      validFrom,
    });
    await this.assignmentRepository.save(assignment);
  }

  async findAssignments(
    caregiverId: string,
    roles: string[],
  ): Promise<ReturnType<CaregiverHallAssignment['toPrimitives']>[]> {
    const assignments = await this.assignmentRepository.findByCaregiverId(
      caregiverId,
    );

    const accessibleHallIds =
      await this.scopeService.getAccessibleHallIds(roles);

    if (accessibleHallIds === null) {
      return assignments.map((a) => a.toPrimitives());
    }

    const scoped = assignments.filter((a) =>
      accessibleHallIds.includes(a.communityHallId),
    );

    if (scoped.length === 0) {
      throw new UnauthorizedException(
        'No tiene permiso para consultar el historial de esta cuidadora',
      );
    }

    return scoped.map((a) => a.toPrimitives());
  }

  private async findCaregiverOrThrow(id: string): Promise<CaregiverMother> {
    const caregiver = await this.caregiverRepository.findById(id);
    if (!caregiver) {
      throw new NotFoundException(`No se encontró una cuidadora con ID ${id}`);
    }
    return caregiver;
  }

  private async enrichWithCurrentHalls(
    caregivers: CaregiverMother[],
  ): Promise<Map<string, CurrentHall>> {
    const caregiverIds = caregivers
      .map((caregiver) => caregiver.id)
      .filter((id): id is string => Boolean(id));
    const currentHalls = new Map<string, CurrentHall>(
      caregiverIds.map((id) => [id, null]),
    );

    if (caregiverIds.length === 0) {
      return currentHalls;
    }

    const assignments = await this.assignmentRepository.findCurrentByCaregiverIds(
      caregiverIds,
    );
    const hallIds = Array.from(
      new Set(assignments.map((assignment) => assignment.communityHallId)),
    );

    if (hallIds.length === 0) {
      return currentHalls;
    }

    const halls = await this.hallRepository.findByIds(hallIds);
    const hallsById = new Map(
      halls
        .filter((hall) => Boolean(hall.id))
        .map((hall) => [hall.id!, { id: hall.id!, name: hall.name }]),
    );

    for (const assignment of assignments) {
      const hall = hallsById.get(assignment.communityHallId);
      if (hall) {
        currentHalls.set(assignment.caregiverId, hall);
      }
    }

    return currentHalls;
  }
}
