import { Inject, Injectable } from '@nestjs/common';
import { NotFoundException } from 'src/domain/exceptions';
import {
  CAREGIVER_SCHEDULE_REPOSITORY,
  COMMUNITY_HALL_REPOSITORY,
} from 'src/domain/constants/tokens';
import { CaregiverScheduleVersion } from 'src/domain/entities/caregiver-schedule-version.entity';
import type { CaregiverScheduleRepository } from 'src/domain/repositories/caregiver-schedule.repository';
import type { CommunityHallRepository } from 'src/domain/repositories/community-hall.repository';
import { CreateScheduleVersionDto } from '../dtos/caregiver-attendance/create-schedule-version.dto';
import { ScheduleVersionResponseDto } from '../dtos/caregiver-attendance/schedule-version-response.dto';
import { CopyScheduleVersionDto } from '../dtos/caregiver-attendance/copy-schedule-version.dto';
import { CaregiverAttendanceScopeService } from './caregiver-attendance-scope.service';
import { addUtcDays } from 'src/common/utils/functions';

@Injectable()
export class CaregiverScheduleService {
  constructor(
    @Inject(CAREGIVER_SCHEDULE_REPOSITORY)
    private readonly scheduleRepository: CaregiverScheduleRepository,
    @Inject(COMMUNITY_HALL_REPOSITORY)
    private readonly hallRepository: CommunityHallRepository,
    private readonly scopeService: CaregiverAttendanceScopeService,
  ) {}

  async create(
    dto: CreateScheduleVersionDto,
    roles: string[],
  ): Promise<ScheduleVersionResponseDto> {
    await this.scopeService.ensureCanManageHall(dto.communityHallId, roles);

    const hall = await this.hallRepository.findById(dto.communityHallId);
    if (!hall) {
      throw new NotFoundException(
        `No existe un local comunal con ID ${dto.communityHallId}`,
      );
    }

    const validFrom = new Date(dto.validFrom);

    await this.scheduleRepository.closeCurrentVersion(
      hall.id!,
      addUtcDays(validFrom, -1),
    );

    const version = CaregiverScheduleVersion.create({
      communityHallId: hall.id!,
      name: dto.name,
      validFrom,
      validTo: dto.validTo ? new Date(dto.validTo) : null,
      blocks: dto.blocks,
      dayRules: dto.dayRules,
      specialDays: dto.specialDays ?? [],
    });

    const saved = await this.scheduleRepository.save(version);
    return ScheduleVersionResponseDto.fromDomain(saved);
  }

  async findById(
    id: string,
    roles: string[],
  ): Promise<ScheduleVersionResponseDto> {
    const version = await this.scheduleRepository.findById(id);
    if (!version) {
      throw new NotFoundException(
        `No se encontró una versión de horario con ID ${id}`,
      );
    }
    await this.scopeService.ensureCanManageHall(version.communityHallId, roles);
    return ScheduleVersionResponseDto.fromDomain(version);
  }

  async findByHallId(
    hallId: string,
    roles: string[],
  ): Promise<ScheduleVersionResponseDto[]> {
    await this.scopeService.ensureCanManageHall(hallId, roles);
    const versions = await this.scheduleRepository.findByHallId(hallId);
    return versions.map((v) => ScheduleVersionResponseDto.fromDomain(v));
  }

  async copyToHall(
    id: string,
    dto: CopyScheduleVersionDto,
    roles: string[],
  ): Promise<ScheduleVersionResponseDto> {
    await this.scopeService.ensureCanManageHall(dto.targetHallId, roles);

    const copy = await this.scheduleRepository.copyToHall(
      id,
      dto.targetHallId,
      new Date(dto.validFrom),
      dto.name,
    );
    return ScheduleVersionResponseDto.fromDomain(copy);
  }
}
