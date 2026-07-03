import { Inject, Injectable } from '@nestjs/common';
import { BadRequestException, NotFoundException } from 'src/domain/exceptions';
import {
  CAREGIVER_ATTENDANCE_EVENT_REPOSITORY,
  CAREGIVER_ATTENDANCE_EXCEPTION_REPOSITORY,
  CAREGIVER_ATTENDANCE_REPOSITORY,
  CAREGIVER_HALL_ASSIGNMENT_REPOSITORY,
  CAREGIVER_MOTHER_REPOSITORY,
  CAREGIVER_SCHEDULE_REPOSITORY,
} from 'src/domain/constants/tokens';
import { RequestUserContext } from 'src/common/contexts/user-context.service';
import { CaregiverAttendanceRecord } from 'src/domain/entities/caregiver-attendance-record.entity';
import { CaregiverAttendanceEvent } from 'src/domain/entities/caregiver-attendance-event.entity';
import type { CaregiverMotherRepository } from 'src/domain/repositories/caregiver-mother.repository';
import type { CaregiverHallAssignmentRepository } from 'src/domain/repositories/caregiver-hall-assignment.repository';
import type { CaregiverScheduleRepository } from 'src/domain/repositories/caregiver-schedule.repository';
import type { CaregiverAttendanceRepository } from 'src/domain/repositories/caregiver-attendance.repository';
import type { CaregiverAttendanceExceptionRepository } from 'src/domain/repositories/caregiver-attendance-exception.repository';
import type { CaregiverAttendanceEventRepository } from 'src/domain/repositories/caregiver-attendance-event.repository';
import { SelfServiceMarkDto } from '../dtos/caregiver-attendance/self-service-mark.dto';
import { AssistedMarkDto } from '../dtos/caregiver-attendance/assisted-mark.dto';
import { CorrectMarkDto } from '../dtos/caregiver-attendance/correct-mark.dto';
import { MarkResponseDto } from '../dtos/caregiver-attendance/mark-response.dto';
import { CaregiverAttendanceScopeService } from './caregiver-attendance-scope.service';
import { AuditService } from './audit.service';
import { nowUtc } from 'src/common/utils/functions';

@Injectable()
export class CaregiverAttendanceMarkingService {
  constructor(
    @Inject(CAREGIVER_MOTHER_REPOSITORY)
    private readonly caregiverRepository: CaregiverMotherRepository,
    @Inject(CAREGIVER_HALL_ASSIGNMENT_REPOSITORY)
    private readonly assignmentRepository: CaregiverHallAssignmentRepository,
    @Inject(CAREGIVER_SCHEDULE_REPOSITORY)
    private readonly scheduleRepository: CaregiverScheduleRepository,
    @Inject(CAREGIVER_ATTENDANCE_REPOSITORY)
    private readonly attendanceRepository: CaregiverAttendanceRepository,
    @Inject(CAREGIVER_ATTENDANCE_EXCEPTION_REPOSITORY)
    private readonly exceptionRepository: CaregiverAttendanceExceptionRepository,
    @Inject(CAREGIVER_ATTENDANCE_EVENT_REPOSITORY)
    private readonly eventRepository: CaregiverAttendanceEventRepository,
    private readonly scopeService: CaregiverAttendanceScopeService,
    private readonly auditService: AuditService,
    private readonly userContext: RequestUserContext,
  ) {}

  async selfServiceMark(dto: SelfServiceMarkDto): Promise<MarkResponseDto> {
    const documentType = (dto.documentType ?? 'DNI').trim().toUpperCase();
    const documentNumber = dto.documentNumber.trim();
    const localDate = dto.localDate ?? this.nowLocalDate();
    const entryTime = dto.entryTime ?? this.nowLocalTime();

    const caregiver = await this.caregiverRepository.findByIdentity(
      documentType,
      documentNumber,
    );

    if (!caregiver) {
      await this.recordEvent({ localDate, reason: 'caregiver_not_found' });
      throw new BadRequestException('Cuidadora no encontrada');
    }

    const targetDate = this.parseLocalDate(localDate);

    if (!caregiver.isActiveOn(targetDate)) {
      await this.recordEvent({
        localDate,
        reason: 'retired_caregiver',
        caregiverId: caregiver.id,
      });
      throw new BadRequestException('La cuidadora no se encuentra activa');
    }

    const assignment =
      await this.assignmentRepository.findActiveByCaregiverAndDate(
        caregiver.id!,
        targetDate,
      );
    if (!assignment) {
      await this.recordEvent({
        localDate,
        reason: 'missing_assignment',
        caregiverId: caregiver.id,
      });
      throw new BadRequestException(
        'La cuidadora no tiene una asignación activa',
      );
    }

    const schedule = await this.scheduleRepository.findActiveByHallAndDate(
      assignment.communityHallId,
      targetDate,
    );
    if (!schedule) {
      await this.recordEvent({
        localDate,
        reason: 'missing_schedule',
        caregiverId: caregiver.id,
        communityHallId: assignment.communityHallId,
      });
      throw new BadRequestException(
        'No existe un horario activo para el local comunal',
      );
    }

    const hallExceptions = await this.exceptionRepository.findByHallAndDate(
      assignment.communityHallId,
      localDate,
    );
    const hallDayOff = hallExceptions.find(
      (e) => e.isAccepted() && (e.kind === 'holiday' || e.kind === 'day_off'),
    );
    if (hallDayOff) {
      await this.recordEvent({
        localDate,
        reason: 'hall_day_off',
        caregiverId: caregiver.id,
        communityHallId: assignment.communityHallId,
        blockId: undefined,
      });
      throw new BadRequestException('El local comunal no tiene atención hoy');
    }

    if (!schedule.isWorkingDay(targetDate)) {
      await this.recordEvent({
        localDate,
        reason: 'non_working_day',
        caregiverId: caregiver.id,
        communityHallId: assignment.communityHallId,
      });
      throw new BadRequestException('Hoy no es un día laborable');
    }

    const blocks = schedule.blocksForDate(targetDate);
    const block = blocks.find((b) => {
      const evaluation = schedule.evaluateMark(b.id, entryTime);
      return evaluation.status !== 'out_of_window';
    });

    if (!block) {
      await this.recordEvent({
        localDate,
        reason: 'out_of_window',
        caregiverId: caregiver.id,
        communityHallId: assignment.communityHallId,
      });
      throw new BadRequestException(
        'La marcación está fuera de la ventana permitida',
      );
    }

    const exists = await this.attendanceRepository.existsOfficialMark(
      caregiver.id!,
      localDate,
      block.id,
    );
    if (exists) {
      await this.recordEvent({
        localDate,
        reason: 'duplicate_mark',
        caregiverId: caregiver.id,
        communityHallId: assignment.communityHallId,
        blockId: block.id,
      });
      throw new BadRequestException(
        'Ya existe una marcación oficial para este bloque',
      );
    }

    const evaluation = schedule.evaluateMark(block.id, entryTime);
    if (evaluation.status === 'out_of_window') {
      await this.recordEvent({
        localDate,
        reason: 'out_of_window',
        caregiverId: caregiver.id,
        communityHallId: assignment.communityHallId,
        blockId: block.id,
      });
      throw new BadRequestException(
        'La marcación está fuera de la ventana permitida',
      );
    }

    const record = CaregiverAttendanceRecord.createOfficial({
      caregiverId: caregiver.id!,
      communityHallId: assignment.communityHallId,
      localDate,
      blockId: block.id,
      entryTime,
      source: 'self-service',
      metadata: {
        documentType,
        documentNumber,
        evaluationStatus: evaluation.status,
      },
    });

    const saved = await this.attendanceRepository.save(record);
    return MarkResponseDto.fromDomain(saved);
  }

  async assistedMark(
    dto: AssistedMarkDto,
    roles: string[],
  ): Promise<MarkResponseDto> {
    const localDate = dto.localDate;
    const targetDate = this.parseLocalDate(localDate);

    const assignment =
      await this.assignmentRepository.findActiveByCaregiverAndDate(
        dto.caregiverId,
        targetDate,
      );
    if (!assignment) {
      throw new BadRequestException(
        'La cuidadora no tiene una asignación activa para la fecha',
      );
    }

    await this.scopeService.ensureCanManageHall(
      assignment.communityHallId,
      roles,
    );

    const record = CaregiverAttendanceRecord.createSpecial({
      caregiverId: dto.caregiverId,
      communityHallId: assignment.communityHallId,
      localDate,
      blockId: dto.blockId,
      entryTime: dto.entryTime,
      source: 'assisted',
      reason: dto.reason,
      performerId: this.userContext.getUserId(),
    });

    const saved = await this.attendanceRepository.save(record);

    await this.auditService.record({
      action: 'caregiver-attendance.assisted',
      entityType: 'CaregiverAttendanceRecord',
      entityId: saved.id!,
      before: null,
      after: saved.toPrimitives(),
      metadata: { reason: dto.reason },
    });

    return MarkResponseDto.fromDomain(saved);
  }

  async findByCaregiverAndDate(
    caregiverId: string,
    localDate?: string,
  ): Promise<MarkResponseDto[]> {
    const records = localDate
      ? await this.attendanceRepository.findByCaregiverAndDate(caregiverId, localDate)
      : await this.attendanceRepository.findByCaregiverAndDate(caregiverId, ''); // extended in future
    return records.map(MarkResponseDto.fromDomain);
  }

  async correctMark(
    id: string,
    dto: CorrectMarkDto,
    roles: string[],
  ): Promise<MarkResponseDto> {
    const original = await this.attendanceRepository.findById(id);
    if (!original) {
      throw new NotFoundException(`No se encontró una marcación con ID ${id}`);
    }

    await this.scopeService.ensureCanManageHall(
      original.communityHallId,
      roles,
    );

    const voided = await this.attendanceRepository.voidMark(id);
    const corrected = CaregiverAttendanceRecord.createCorrection({
      original: voided,
      newEntryTime: dto.entryTime,
      reason: dto.reason,
      performerId: this.userContext.getUserId(),
    });
    const saved = await this.attendanceRepository.save(corrected);

    await this.auditService.record({
      action: 'caregiver-attendance.correction',
      entityType: 'CaregiverAttendanceRecord',
      entityId: saved.id!,
      before: original.toPrimitives(),
      after: saved.toPrimitives(),
      metadata: { reason: dto.reason },
    });

    return MarkResponseDto.fromDomain(saved);
  }

  private async recordEvent(input: {
    localDate: string;
    reason: string;
    caregiverId?: string;
    communityHallId?: string;
    blockId?: string;
  }): Promise<void> {
    await this.eventRepository.save(
      CaregiverAttendanceEvent.create({
        localDate: input.localDate,
        reason: input.reason,
        source: 'self-service',
        caregiverId: input.caregiverId,
        communityHallId: input.communityHallId,
        blockId: input.blockId,
      }),
    );
  }

  private nowLocalDate(): string {
    return this.formatIsoDate(nowUtc());
  }

  private nowLocalTime(): string {
    const now = nowUtc();
    return `${String(now.getUTCHours()).padStart(2, '0')}:${String(
      now.getUTCMinutes(),
    ).padStart(2, '0')}`;
  }

  private parseLocalDate(localDate: string): Date {
    const [year, month, day] = localDate.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day));
  }

  private formatIsoDate(date: Date): string {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
