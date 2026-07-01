# Design: Caregiver Attendance

## Technical Approach

Add a dedicated NestJS module that follows the existing Child/Committee/Audit Clean Architecture pattern: domain entities/repository interfaces, application DTOs/services, Mongo schemas/repositories, controller, DI tokens, and `AppModule` registration. Attendance is modeled as immutable historical facts plus versioned hall assignments/schedules so reports are calculated by the state valid on each local attendance date.

## Architecture Decisions

| Decision | Choice | Alternatives considered | Rationale |
|---|---|---|---|
| Bounded module | `CaregiverAttendanceModule` with one controller and focused services | Split by caregiver/schedule/report modules immediately | Mirrors current feature modules while keeping first delivery coherent and testable. |
| History model | Separate assignment history and schedule version collections with `validFrom`/`validTo` | Mutate caregiver current hall/schedule only | Prevents report drift after transfers or schedule changes. |
| Dates/times | Store `localDate: YYYY-MM-DD`, block entry/exit as `HH:mm`, audit timestamps as UTC `Date` | Store only UTC instants | Business rules are calendar-local; UTC remains for ordering/audit. |
| Authorization | Central application scope service using roles + `CommitteeMembershipRepository` + hall committee lookup | Controller-only role checks | Admin/AT scope must be reused consistently across CRUD, marks, reports. |
| Audit model | Persist attendance-domain events and extend `AuditService` with system/anonymous actor support | Use only domain events or force public calls through current audit context | Requirements need AuditService coverage for assisted actions, corrections, duplicates, out-of-window and special attempts; current audit assumes an authenticated user. |

## Data Flow

Self-service mark:

    POST /caregiver-attendance/marks/self-service (public)
      -> service resolves caregiver by document
      -> assignment active on localDate
      -> schedule version + block window
      -> exceptions/duplicates
      -> AttendanceRecord or AttendanceEvent

Monthly report:

    month range -> candidate caregivers/marks
      -> per day resolve assignment + schedule version
      -> per block apply hall/caregiver exceptions
      -> official/special marks -> tardy/absence totals

## File Changes

| File | Action | Description |
|---|---|---|
| `src/domain/constants/tokens.ts` | Modify | Add caregiver repository DI tokens. |
| `src/domain/entities/caregiver-mother.entity.ts`, `caregiver-hall-assignment.entity.ts`, `caregiver-schedule-version.entity.ts`, `caregiver-attendance-record.entity.ts`, `caregiver-attendance-exception.entity.ts`, `caregiver-attendance-event.entity.ts` | Create | Caregiver identity, assignment history, schedule versions/blocks/day rules, marks, exceptions, special events. |
| `src/domain/repositories/caregiver-mother.repository.ts`, `caregiver-hall-assignment.repository.ts`, `caregiver-schedule.repository.ts`, `caregiver-attendance.repository.ts`, `caregiver-attendance-exception.repository.ts`, `caregiver-attendance-event.repository.ts` | Create | Interfaces for identity, assignment, schedule, attendance, exception, event/report lookup. |
| `src/application/dtos/caregiver-attendance/*` | Create | Validation/Swagger DTOs and report responses. |
| `src/application/services/caregiver-attendance*.service.ts` | Create | CRUD, scope checks, marking, corrections, reports. |
| `src/infrastructure/database/mongo/schemas/caregiver-*.schema.ts`, `src/infrastructure/database/mongo/repositories/caregiver-*-mongo.repository.ts` | Create | Mongoose persistence and indexes for the new collections. |
| `src/application/services/audit.service.ts`, `src/infrastructure/database/mongo/schemas/audit-event.schema.ts` | Modify | Support non-user actors for public self-service attempt auditing. |
| `src/infrastructure/controllers/caregiver-attendance.controller.ts` | Create | REST endpoints. |
| `src/infrastructure/modules/caregiver-attendance.module.ts` | Create | Module wiring with `DatabaseModule`, `AuthModule`, `AuditModule`. |
| `src/infrastructure/database/mongo/mongo.module.ts`, `src/app.module.ts` | Modify | Register schemas, repositories, module. |

## Interfaces / Contracts

Endpoints under `/caregiver-attendance`: caregiver CRUD; `POST /caregivers/:id/transfers`; `GET /caregivers/:id/assignments`; schedule CRUD and `POST /schedules/:id/copy`; `POST /marks/self-service` public document-only; `POST /marks/assisted`; `PATCH /marks/:id/correction`; exception CRUD; `GET /reports/halls/:hallId/monthly`; `GET /reports/committees/:committeeId/monthly`; optional `GET /events` for special attempts.

Mongo indexes: unique `{ documentType, documentNumber }`; assignment `{ caregiverId, validFrom, validTo }` and `{ communityHallId, validFrom }`; schedule `{ communityHallId, validFrom, validTo }`; unique feasible attendance `{ caregiverId, localDate, blockId, markKind, isVoided:false }`; report indexes `{ communityHallId, localDate }`, `{ caregiverId, localDate }`, event `{ localDate, reason }`.

Audit strategy: authenticated assisted marks/corrections store performer, reason, before/after, and UTC timestamp through `AuditService`. Self-service duplicate/out-of-window/non-working/special attempts create `CaregiverAttendanceEvent` and an audit entry with `actorType=caregiver|system` and document metadata, avoiding a fake user id.

Report algorithm: month boundaries are local first/last day converted to `YYYY-MM-DD`. For each date/block, include caregivers with marks by default; when `includeExpectedWithoutMarks=true`, include active caregivers assigned to the hall on that date. Hall holidays remove expected blocks; caregiver accepted justifications prevent unjustified absence. Tardiness is `actualEntry > entryTime + toleranceMinutes` per block. Special/assisted marks count separately but can satisfy presence when accepted.

## Testing Strategy

| Layer | What to Test | Approach |
|---|---|---|
| Unit | entities, schedule windows, scope service, report calculator | Strict TDD with pure domain/application specs. |
| Repository | indexes and date-range queries | Mocked Mongoose first; integration only if test DB is introduced. |
| Controller | DTO validation, public/auth routes, role denial | Nest testing module with mocked services/guards. |

## Migration / Rollout

No existing data migration. Rollout creates new collections and indexes; provide optional index creation script if auto-indexing is disabled in production.

## Risks / Tradeoffs

- Extending `AuditService`/schema is safer than bypassing audit, but touches a shared admin feature.
- Mongo unique partial indexes reduce duplicates but service-level checks are still required for voided/corrected marks.
- Report correctness depends on non-overlapping assignment and schedule versions.

## Open Questions

- [ ] Confirm self-service input: DNI-only default or explicit `documentType` plus number.
- [ ] Confirm exact exception taxonomy for hall-level versus caregiver-level justifications.
- [ ] Confirm audit response expectations for public caregiver attempts in admin audit screens.
