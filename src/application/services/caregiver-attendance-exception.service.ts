import { Inject, Injectable } from '@nestjs/common';
import { CAREGIVER_ATTENDANCE_EXCEPTION_REPOSITORY } from 'src/domain/constants/tokens';
import { CaregiverAttendanceException } from 'src/domain/entities/caregiver-attendance-exception.entity';
import type { CaregiverAttendanceExceptionRepository } from 'src/domain/repositories/caregiver-attendance-exception.repository';
import { CreateExceptionDto } from '../dtos/caregiver-attendance/create-exception.dto';
import { ExceptionResponseDto } from '../dtos/caregiver-attendance/exception-response.dto';
import { CaregiverAttendanceScopeService } from './caregiver-attendance-scope.service';

@Injectable()
export class CaregiverAttendanceExceptionService {
  constructor(
    @Inject(CAREGIVER_ATTENDANCE_EXCEPTION_REPOSITORY)
    private readonly exceptionRepository: CaregiverAttendanceExceptionRepository,
    private readonly scopeService: CaregiverAttendanceScopeService,
  ) {}

  async create(
    dto: CreateExceptionDto,
    roles: string[],
  ): Promise<ExceptionResponseDto> {
    if (dto.scope === 'hall' && dto.communityHallId) {
      await this.scopeService.ensureCanManageHall(dto.communityHallId, roles);
    }

    const exception =
      dto.scope === 'hall' && dto.communityHallId
        ? CaregiverAttendanceException.hallHoliday({
            communityHallId: dto.communityHallId,
            localDate: dto.localDate,
            reason: dto.reason,
            status: dto.status ?? 'accepted',
          })
        : CaregiverAttendanceException.caregiverJustification({
            caregiverId: dto.caregiverId!,
            localDate: dto.localDate,
            blockId: dto.blockId,
            reason: dto.reason,
            status: dto.status ?? 'accepted',
          });

    const saved = await this.exceptionRepository.save(exception);
    return ExceptionResponseDto.fromDomain(saved);
  }

  async findByHallAndDate(
    hallId: string,
    localDate: string,
    roles: string[],
  ): Promise<ExceptionResponseDto[]> {
    await this.scopeService.ensureCanManageHall(hallId, roles);
    const exceptions = await this.exceptionRepository.findByHallAndDate(
      hallId,
      localDate,
    );
    return exceptions.map((e) => ExceptionResponseDto.fromDomain(e));
  }

  async findByCaregiverAndDate(
    caregiverId: string,
    localDate: string,
  ): Promise<ExceptionResponseDto[]> {
    const exceptions = await this.exceptionRepository.findByCaregiverAndDate(
      caregiverId,
      localDate,
    );
    return exceptions.map((e) => ExceptionResponseDto.fromDomain(e));
  }
}
