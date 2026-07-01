import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { AuthModule } from './auth.module';
import { AuditModule } from './audit.module';
import { ContextModule } from 'src/common/contexts/context.module';
import { CaregiverAttendanceController } from '../controllers/caregiver-attendance.controller';
import { CaregiverMotherService } from 'src/application/services/caregiver-mother.service';
import { CaregiverScheduleService } from 'src/application/services/caregiver-schedule.service';
import { CaregiverAttendanceMarkingService } from 'src/application/services/caregiver-attendance-marking.service';
import { CaregiverAttendanceExceptionService } from 'src/application/services/caregiver-attendance-exception.service';
import { CaregiverAttendanceReportService } from 'src/application/services/caregiver-attendance-report.service';
import { CaregiverAttendanceScopeService } from 'src/application/services/caregiver-attendance-scope.service';

@Module({
  imports: [ContextModule, AuthModule, DatabaseModule, AuditModule],
  controllers: [CaregiverAttendanceController],
  providers: [
    CaregiverMotherService,
    CaregiverScheduleService,
    CaregiverAttendanceMarkingService,
    CaregiverAttendanceExceptionService,
    CaregiverAttendanceReportService,
    CaregiverAttendanceScopeService,
  ],
})
export class CaregiverAttendanceModule {}
