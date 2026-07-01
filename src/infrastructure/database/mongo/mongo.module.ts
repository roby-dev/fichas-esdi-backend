import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { Person, PersonSchema } from './schemas/person.schema';
import {
  CommunityHall,
  CommunityHallSchema,
} from './schemas/community-hall.schema';
import {
  CommitteeMembership,
  CommitteeMembershipSchema,
} from './schemas/committee-membership.schema';
import { Child, ChildSchema } from './schemas/child.schema';
import { User, UserSchema } from './schemas/user.schema';
import { AlertChild, AlertChildSchema } from './schemas/alert-child.schema';
import { AuditEvent, AuditEventSchema } from './schemas/audit-event.schema';
import {
  ChildHistory,
  ChildHistorySchema,
} from './schemas/child-history.schema';
import {
  ImportErrorLog,
  ImportErrorLogSchema,
} from './schemas/import-error-log.schema';
import {
  CaregiverMother,
  CaregiverMotherSchema,
} from './schemas/caregiver-mother.schema';
import {
  CaregiverHallAssignment,
  CaregiverHallAssignmentSchema,
} from './schemas/caregiver-hall-assignment.schema';
import {
  CaregiverScheduleVersion,
  CaregiverScheduleVersionSchema,
} from './schemas/caregiver-schedule-version.schema';
import {
  CaregiverAttendanceRecord,
  CaregiverAttendanceRecordSchema,
} from './schemas/caregiver-attendance-record.schema';
import {
  CaregiverAttendanceException,
  CaregiverAttendanceExceptionSchema,
} from './schemas/caregiver-attendance-exception.schema';
import {
  CaregiverAttendanceEvent,
  CaregiverAttendanceEventSchema,
} from './schemas/caregiver-attendance-event.schema';

import {
  ALERT_CHILD_REPOSITORY,
  AUDIT_EVENT_REPOSITORY,
  CAREGIVER_ATTENDANCE_EVENT_REPOSITORY,
  CAREGIVER_ATTENDANCE_EXCEPTION_REPOSITORY,
  CAREGIVER_ATTENDANCE_REPOSITORY,
  CAREGIVER_HALL_ASSIGNMENT_REPOSITORY,
  CAREGIVER_MOTHER_REPOSITORY,
  CAREGIVER_SCHEDULE_REPOSITORY,
  CHILD_HISTORY_REPOSITORY,
  CHILD_REPOSITORY,
  COMMITTEE_MEMBERSHIP_REPOSITORY,
  COMMITTEE_REPOSITORY,
  COMMUNITY_HALL_REPOSITORY,
  IMPORT_ERROR_LOG_REPOSITORY,
  PERSON_REPOSITORY,
  SESSION_REPOSITORY,
  USER_REPOSITORY,
} from 'src/domain/constants/tokens';
import { MongoPersonRepository } from './repositories/mongo-person.repository';
import { CommunityHallMongoRepository } from './repositories/community-hall-mongo.repository';
import { CommitteeMembershipMongoRepository } from './repositories/committee-membership-mongo.repository';
import { ChildMongoRepository } from './repositories/child-mongo.repository';
import { UserMongoRepository } from './repositories/user-mongo.repository';
import { AlertChildMongoRepository } from './repositories/alert-child-monto.repository';
import { Session, SessionSchema } from './schemas/session.schema';
import { SessionMongoRepository } from './repositories/session-mongo.repository';
import { Committee, CommitteeSchema } from './schemas/committee.schema';
import { CommitteeMongoRepository } from './repositories/comittee-mongo.repository';
import { AuditEventMongoRepository } from './repositories/audit-event-mongo.repository';
import { ChildHistoryMongoRepository } from './repositories/child-history-mongo.repository';
import { ImportErrorLogMongoRepository } from './repositories/import-error-log-mongo.repository';
import { CaregiverMotherMongoRepository } from './repositories/caregiver-mother-mongo.repository';
import { CaregiverHallAssignmentMongoRepository } from './repositories/caregiver-hall-assignment-mongo.repository';
import { CaregiverScheduleMongoRepository } from './repositories/caregiver-schedule-mongo.repository';
import { CaregiverAttendanceMongoRepository } from './repositories/caregiver-attendance-mongo.repository';
import { CaregiverAttendanceExceptionMongoRepository } from './repositories/caregiver-attendance-exception-mongo.repository';
import { CaregiverAttendanceEventMongoRepository } from './repositories/caregiver-attendance-event-mongo.repository';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Person.name, schema: PersonSchema },
      { name: CommunityHall.name, schema: CommunityHallSchema },
      { name: CommitteeMembership.name, schema: CommitteeMembershipSchema },
      { name: Child.name, schema: ChildSchema },
      { name: User.name, schema: UserSchema },
      { name: AlertChild.name, schema: AlertChildSchema },
      { name: Session.name, schema: SessionSchema },
      { name: Committee.name, schema: CommitteeSchema },
      { name: AuditEvent.name, schema: AuditEventSchema },
      { name: ChildHistory.name, schema: ChildHistorySchema },
      { name: ImportErrorLog.name, schema: ImportErrorLogSchema },
      { name: CaregiverMother.name, schema: CaregiverMotherSchema },
      {
        name: CaregiverHallAssignment.name,
        schema: CaregiverHallAssignmentSchema,
      },
      {
        name: CaregiverScheduleVersion.name,
        schema: CaregiverScheduleVersionSchema,
      },
      {
        name: CaregiverAttendanceRecord.name,
        schema: CaregiverAttendanceRecordSchema,
      },
      {
        name: CaregiverAttendanceException.name,
        schema: CaregiverAttendanceExceptionSchema,
      },
      {
        name: CaregiverAttendanceEvent.name,
        schema: CaregiverAttendanceEventSchema,
      },
    ]),
  ],
  providers: [
    {
      provide: PERSON_REPOSITORY,
      useClass: MongoPersonRepository,
    },
    {
      provide: COMMUNITY_HALL_REPOSITORY,
      useClass: CommunityHallMongoRepository,
    },
    {
      provide: COMMITTEE_MEMBERSHIP_REPOSITORY,
      useClass: CommitteeMembershipMongoRepository,
    },
    {
      provide: CHILD_REPOSITORY,
      useClass: ChildMongoRepository,
    },
    {
      provide: USER_REPOSITORY,
      useClass: UserMongoRepository,
    },
    {
      provide: ALERT_CHILD_REPOSITORY,
      useClass: AlertChildMongoRepository,
    },
    {
      provide: SESSION_REPOSITORY,
      useClass: SessionMongoRepository,
    },
    {
      provide: COMMITTEE_REPOSITORY,
      useClass: CommitteeMongoRepository,
    },
    {
      provide: AUDIT_EVENT_REPOSITORY,
      useClass: AuditEventMongoRepository,
    },
    {
      provide: CHILD_HISTORY_REPOSITORY,
      useClass: ChildHistoryMongoRepository,
    },
    {
      provide: IMPORT_ERROR_LOG_REPOSITORY,
      useClass: ImportErrorLogMongoRepository,
    },
    {
      provide: CAREGIVER_MOTHER_REPOSITORY,
      useClass: CaregiverMotherMongoRepository,
    },
    {
      provide: CAREGIVER_HALL_ASSIGNMENT_REPOSITORY,
      useClass: CaregiverHallAssignmentMongoRepository,
    },
    {
      provide: CAREGIVER_SCHEDULE_REPOSITORY,
      useClass: CaregiverScheduleMongoRepository,
    },
    {
      provide: CAREGIVER_ATTENDANCE_REPOSITORY,
      useClass: CaregiverAttendanceMongoRepository,
    },
    {
      provide: CAREGIVER_ATTENDANCE_EXCEPTION_REPOSITORY,
      useClass: CaregiverAttendanceExceptionMongoRepository,
    },
    {
      provide: CAREGIVER_ATTENDANCE_EVENT_REPOSITORY,
      useClass: CaregiverAttendanceEventMongoRepository,
    },
  ],
  exports: [
    PERSON_REPOSITORY,
    COMMUNITY_HALL_REPOSITORY,
    COMMITTEE_MEMBERSHIP_REPOSITORY,
    CHILD_REPOSITORY,
    USER_REPOSITORY,
    ALERT_CHILD_REPOSITORY,
    SESSION_REPOSITORY,
    COMMITTEE_REPOSITORY,
    AUDIT_EVENT_REPOSITORY,
    CHILD_HISTORY_REPOSITORY,
    IMPORT_ERROR_LOG_REPOSITORY,
    CAREGIVER_MOTHER_REPOSITORY,
    CAREGIVER_HALL_ASSIGNMENT_REPOSITORY,
    CAREGIVER_SCHEDULE_REPOSITORY,
    CAREGIVER_ATTENDANCE_REPOSITORY,
    CAREGIVER_ATTENDANCE_EXCEPTION_REPOSITORY,
    CAREGIVER_ATTENDANCE_EVENT_REPOSITORY,
  ],
})
export class MongoModule {}
