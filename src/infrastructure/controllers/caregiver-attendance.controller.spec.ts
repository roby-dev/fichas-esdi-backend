import { CaregiverAttendanceController } from './caregiver-attendance.controller';
import { CaregiverMotherService } from 'src/application/services/caregiver-mother.service';
import { CaregiverScheduleService } from 'src/application/services/caregiver-schedule.service';
import { CaregiverAttendanceMarkingService } from 'src/application/services/caregiver-attendance-marking.service';
import { CaregiverAttendanceExceptionService } from 'src/application/services/caregiver-attendance-exception.service';
import { CaregiverAttendanceReportService } from 'src/application/services/caregiver-attendance-report.service';
import { CaregiverMotherResponseDto } from 'src/application/dtos/caregiver-attendance/caregiver-mother-response.dto';
import { MarkResponseDto } from 'src/application/dtos/caregiver-attendance/mark-response.dto';
import { MonthlyHallReportResponseDto } from 'src/application/dtos/caregiver-attendance/monthly-hall-report-response.dto';

describe('CaregiverAttendanceController', () => {
  let controller: CaregiverAttendanceController;
  let caregiverService: jest.Mocked<CaregiverMotherService>;
  let scheduleService: jest.Mocked<CaregiverScheduleService>;
  let markingService: jest.Mocked<CaregiverAttendanceMarkingService>;
  let exceptionService: jest.Mocked<CaregiverAttendanceExceptionService>;
  let reportService: jest.Mocked<CaregiverAttendanceReportService>;

  const user = { sub: 'user-1', email: 'at@example.com', roles: ['AT'] };

  beforeEach(() => {
    caregiverService = {
      create: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      transfer: jest.fn(),
      findAssignments: jest.fn(),
    } as unknown as jest.Mocked<CaregiverMotherService>;

    scheduleService = {
      create: jest.fn(),
      findById: jest.fn(),
      findByHallId: jest.fn(),
      copyToHall: jest.fn(),
    } as unknown as jest.Mocked<CaregiverScheduleService>;

    markingService = {
      selfServiceMark: jest.fn(),
      assistedMark: jest.fn(),
      correctMark: jest.fn(),
    } as unknown as jest.Mocked<CaregiverAttendanceMarkingService>;

    exceptionService = {
      create: jest.fn(),
      findByHallAndDate: jest.fn(),
    } as unknown as jest.Mocked<CaregiverAttendanceExceptionService>;

    reportService = {
      hallMonthlyReport: jest.fn(),
      committeeMonthlyReport: jest.fn(),
    } as unknown as jest.Mocked<CaregiverAttendanceReportService>;

    controller = new CaregiverAttendanceController(
      caregiverService,
      scheduleService,
      markingService,
      exceptionService,
      reportService,
    );
  });

  describe('POST /marks/self-service', () => {
    it('returns the mark created by self-service', async () => {
      const mark = {
        id: 'mark-1',
        markKind: 'official',
      } as MarkResponseDto;
      markingService.selfServiceMark.mockResolvedValue(mark);

      const result = await controller.selfServiceMark({
        documentNumber: '12345678',
      });

      expect(result).toBe(mark);
      expect(markingService.selfServiceMark).toHaveBeenCalledWith({
        documentNumber: '12345678',
      });
    });
  });

  describe('GET /caregivers', () => {
    it('lists caregivers using the caller roles', async () => {
      caregiverService.findAll.mockResolvedValue([]);

      await controller.findAll({ user } as any);

      expect(caregiverService.findAll).toHaveBeenCalledWith(['AT'], 10, 0);
    });
  });

  describe('GET /reports/halls/:hallId/monthly', () => {
    it('returns the monthly hall report', async () => {
      const report = { hallId: 'hall-1' } as MonthlyHallReportResponseDto;
      reportService.hallMonthlyReport.mockResolvedValue(report);

      const result = await controller.hallMonthlyReport(
        { user } as any,
        'hall-1',
        { year: 2025, month: 1 } as any,
      );

      expect(result.hallId).toBe('hall-1');
      expect(reportService.hallMonthlyReport).toHaveBeenCalledWith(
        'hall-1',
        2025,
        1,
        false,
        ['AT'],
      );
    });
  });
});
