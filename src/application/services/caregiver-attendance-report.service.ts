import { Inject, Injectable } from '@nestjs/common';
import { UnauthorizedException } from 'src/domain/exceptions';
import {
  CAREGIVER_ATTENDANCE_EXCEPTION_REPOSITORY,
  CAREGIVER_ATTENDANCE_REPOSITORY,
  CAREGIVER_HALL_ASSIGNMENT_REPOSITORY,
  CAREGIVER_MOTHER_REPOSITORY,
  CAREGIVER_SCHEDULE_REPOSITORY,
  COMMITTEE_REPOSITORY,
  COMMUNITY_HALL_REPOSITORY,
} from 'src/domain/constants/tokens';
import type { CaregiverMotherRepository } from 'src/domain/repositories/caregiver-mother.repository';
import type { CaregiverHallAssignmentRepository } from 'src/domain/repositories/caregiver-hall-assignment.repository';
import type { CaregiverScheduleRepository } from 'src/domain/repositories/caregiver-schedule.repository';
import type { CaregiverAttendanceRepository } from 'src/domain/repositories/caregiver-attendance.repository';
import type { CaregiverAttendanceExceptionRepository } from 'src/domain/repositories/caregiver-attendance-exception.repository';
import type { CommunityHallRepository } from 'src/domain/repositories/community-hall.repository';
import type { CommitteeRepository } from 'src/domain/repositories/committee.repository';
import { CaregiverAttendanceScopeService } from './caregiver-attendance-scope.service';
import {
  MonthlyHallReportResponseDto,
  CaregiverMonthlySummaryDto,
  BlockOutcomeDto,
} from '../dtos/caregiver-attendance/monthly-hall-report-response.dto';
import {
  MonthlyCommitteeReportResponseDto,
  HallSummaryDto,
} from '../dtos/caregiver-attendance/monthly-committee-report-response.dto';
import { CaregiverScheduleVersion } from 'src/domain/entities/caregiver-schedule-version.entity';
import { CaregiverAttendanceRecord } from 'src/domain/entities/caregiver-attendance-record.entity';
import { CaregiverAttendanceException } from 'src/domain/entities/caregiver-attendance-exception.entity';

@Injectable()
export class CaregiverAttendanceReportService {
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
    @Inject(COMMUNITY_HALL_REPOSITORY)
    private readonly hallRepository: CommunityHallRepository,
    @Inject(COMMITTEE_REPOSITORY)
    private readonly committeeRepository: CommitteeRepository,
    private readonly scopeService: CaregiverAttendanceScopeService,
  ) {}

  async hallMonthlyReport(
    hallId: string,
    year: number,
    month: number,
    includeExpectedWithoutMarks: boolean,
    roles: string[],
  ): Promise<MonthlyHallReportResponseDto> {
    await this.ensureHallAccessible(hallId, roles);

    const { firstDate, lastDate, firstLocalDate, lastLocalDate } =
      this.monthBoundaries(year, month);

    const [schedules, assignments, records, hallExceptions, allCaregivers] =
      await Promise.all([
        this.scheduleRepository.findByHallId(hallId),
        this.assignmentRepository.findByHallIdAndDateRange(
          hallId,
          firstDate,
          lastDate,
        ),
        this.attendanceRepository.findByHallAndDateRange(
          hallId,
          firstLocalDate,
          lastLocalDate,
        ),
        this.exceptionRepository.findByHallDateRange(
          hallId,
          firstLocalDate,
          lastLocalDate,
        ),
        this.caregiverRepository.findAll(10000, 0),
      ]);

    const caregiverMap = new Map(allCaregivers.map((c) => [c.id!, c]));
    const caregiverExceptionLists = await Promise.all(
      Array.from(caregiverMap.keys()).map((caregiverId) =>
        this.exceptionRepository.findByCaregiverDateRange(
          caregiverId,
          firstLocalDate,
          lastLocalDate,
        ),
      ),
    );
    const caregiverExceptions = caregiverExceptionLists.flat();

    const recordsByCaregiverAndDate = this.groupRecords(records);
    const exceptionsByCaregiver =
      this.groupCaregiverExceptions(caregiverExceptions);

    const caregiverSummaries = new Map<string, CaregiverMonthlySummaryDto>();

    for (
      let d = new Date(firstDate);
      d <= lastDate;
      d.setUTCDate(d.getUTCDate() + 1)
    ) {
      const localDate = this.formatLocalDate(d);
      const schedule = this.findActiveVersion(schedules, d);
      if (!schedule || !schedule.isWorkingDay(d)) continue;

      const dayHallExceptions = hallExceptions.filter(
        (e) => e.localDate === localDate && e.isAccepted(),
      );
      const isHallDayOff = dayHallExceptions.some(
        (e) => e.kind === 'holiday' || e.kind === 'day_off',
      );
      if (isHallDayOff) continue;

      const blocks = schedule.blocksForDate(d);
      const dayAssignments = assignments.filter((a) => a.isActiveOn(d));

      for (const assignment of dayAssignments) {
        const caregiver = caregiverMap.get(assignment.caregiverId);
        if (!caregiver) continue;

        const summary = this.getOrCreateSummary(caregiverSummaries, caregiver);
        const key = `${caregiver.id}:${localDate}`;
        const dayRecords = recordsByCaregiverAndDate.get(key) ?? [];
        const caregiverExcs =
          exceptionsByCaregiver.get(`${caregiver.id}:${localDate}`) ?? [];

        for (const block of blocks) {
          const outcome = this.resolveBlockOutcome(
            block,
            dayRecords,
            caregiverExcs,
            includeExpectedWithoutMarks,
            schedule,
            caregiver.id!,
            localDate,
          );
          if (!outcome) continue;

          summary.outcomes.push(outcome);
          this.incrementCounts(summary, outcome);
        }
      }
    }

    return {
      hallId,
      year,
      month,
      caregivers: Array.from(caregiverSummaries.values()),
    };
  }

  async committeeMonthlyReport(
    committeeId: string,
    year: number,
    month: number,
    includeExpectedWithoutMarks: boolean,
    roles: string[],
  ): Promise<MonthlyCommitteeReportResponseDto> {
    await this.scopeService.ensureCanManageCommittee(committeeId, roles);

    const halls = await this.hallRepository.findAllByCommitteeRef(
      committeeId,
      1000,
      0,
    );

    const hallReports = await Promise.all(
      halls.map((hall) =>
        this.hallMonthlyReport(
          hall.id!,
          year,
          month,
          includeExpectedWithoutMarks,
          roles,
        ),
      ),
    );

    return {
      committeeId,
      year,
      month,
      halls: hallReports.map((report): HallSummaryDto => {
        const hall = halls.find((h) => h.id === report.hallId)!;
        return {
          hallId: report.hallId,
          hallName: hall.name,
          presentCount: report.caregivers.reduce(
            (sum, c) => sum + c.presentCount,
            0,
          ),
          tardyCount: report.caregivers.reduce(
            (sum, c) => sum + c.tardyCount,
            0,
          ),
          specialCount: report.caregivers.reduce(
            (sum, c) => sum + c.specialCount,
            0,
          ),
          justifiedAbsenceCount: report.caregivers.reduce(
            (sum, c) => sum + c.justifiedAbsenceCount,
            0,
          ),
          unjustifiedAbsenceCount: report.caregivers.reduce(
            (sum, c) => sum + c.unjustifiedAbsenceCount,
            0,
          ),
        };
      }),
    };
  }

  private async ensureHallAccessible(
    hallId: string,
    roles: string[],
  ): Promise<void> {
    const accessible = await this.scopeService.getAccessibleHallIds(roles);
    if (accessible === null) return;
    if (!accessible.includes(hallId)) {
      throw new UnauthorizedException('No tiene acceso a este local comunal');
    }
  }

  private monthBoundaries(year: number, month: number) {
    const firstDate = new Date(Date.UTC(year, month - 1, 1));
    const lastDate = new Date(Date.UTC(year, month, 0));
    return {
      firstDate,
      lastDate,
      firstLocalDate: this.formatLocalDate(firstDate),
      lastLocalDate: this.formatLocalDate(lastDate),
    };
  }

  private formatLocalDate(date: Date): string {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private findActiveVersion(
    versions: CaregiverScheduleVersion[],
    date: Date,
  ): CaregiverScheduleVersion | undefined {
    return versions
      .filter((v) => v.activeOn(date))
      .sort((a, b) => b.validFrom.getTime() - a.validFrom.getTime())[0];
  }

  private groupRecords(
    records: CaregiverAttendanceRecord[],
  ): Map<string, CaregiverAttendanceRecord[]> {
    const map = new Map<string, CaregiverAttendanceRecord[]>();
    for (const record of records) {
      if (record.isVoided) continue;
      const key = `${record.caregiverId}:${record.localDate}`;
      const list = map.get(key) ?? [];
      list.push(record);
      map.set(key, list);
    }
    return map;
  }

  private groupCaregiverExceptions(
    exceptions: CaregiverAttendanceException[],
  ): Map<string, CaregiverAttendanceException[]> {
    const map = new Map<string, CaregiverAttendanceException[]>();
    for (const exception of exceptions) {
      const key = `${exception.caregiverId}:${exception.localDate}`;
      const list = map.get(key) ?? [];
      list.push(exception);
      map.set(key, list);
    }
    return map;
  }

  private getOrCreateSummary(
    map: Map<string, CaregiverMonthlySummaryDto>,
    caregiver: { id?: string; fullName: string },
  ): CaregiverMonthlySummaryDto {
    const existing = map.get(caregiver.id!);
    if (existing) return existing;

    const summary: CaregiverMonthlySummaryDto = {
      caregiverId: caregiver.id!,
      fullName: caregiver.fullName,
      outcomes: [],
      presentCount: 0,
      tardyCount: 0,
      specialCount: 0,
      justifiedAbsenceCount: 0,
      unjustifiedAbsenceCount: 0,
    };
    map.set(caregiver.id!, summary);
    return summary;
  }

  private resolveBlockOutcome(
    block: { id: string; name: string },
    dayRecords: CaregiverAttendanceRecord[],
    caregiverExceptions: CaregiverAttendanceException[],
    includeExpectedWithoutMarks: boolean,
    schedule: CaregiverScheduleVersion,
    caregiverId: string,
    localDate: string,
  ): BlockOutcomeDto | null {
    const record = dayRecords.find(
      (r) => r.blockId === block.id && !r.isVoided,
    );

    if (record) {
      if (record.markKind === 'special') {
        return {
          localDate: record.localDate,
          blockId: block.id,
          blockName: block.name,
          outcome: 'special',
          entryTime: record.entryTime ?? null,
          reason: record.reason ?? null,
        };
      }

      const evaluation = schedule.evaluateMark(block.id, record.entryTime!);
      const outcome: BlockOutcomeDto['outcome'] =
        evaluation.status === 'tardy' ? 'tardy' : 'present';

      return {
        localDate: record.localDate,
        blockId: block.id,
        blockName: block.name,
        outcome,
        entryTime: record.entryTime ?? null,
        reason: record.reason ?? null,
      };
    }

    const justification = caregiverExceptions.find((e) =>
      e.appliesToCaregiverBlock(caregiverId, localDate, block.id),
    );

    if (justification) {
      return {
        localDate,
        blockId: block.id,
        blockName: block.name,
        outcome: 'justified',
        entryTime: null,
        reason: justification.reason,
      };
    }

    if (!includeExpectedWithoutMarks) return null;

    return {
      localDate,
      blockId: block.id,
      blockName: block.name,
      outcome: 'absent',
      entryTime: null,
      reason: null,
    };
  }

  private incrementCounts(
    summary: CaregiverMonthlySummaryDto,
    outcome: BlockOutcomeDto,
  ): void {
    switch (outcome.outcome) {
      case 'present':
        summary.presentCount++;
        break;
      case 'tardy':
        summary.tardyCount++;
        break;
      case 'special':
        summary.specialCount++;
        break;
      case 'justified':
        summary.justifiedAbsenceCount++;
        break;
      case 'absent':
        summary.unjustifiedAbsenceCount++;
        break;
    }
  }
}
