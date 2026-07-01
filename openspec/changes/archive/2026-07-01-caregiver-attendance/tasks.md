# Tasks: Caregiver Attendance

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 600–900 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 (domain/persistence) → PR 2 (application core) → PR 3 (controller/module/verification) |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Domain entities + repository interfaces + Mongo persistence | PR 1 | `main`; includes repository contract tests |
| 2 | Application services, DTOs, scope/audit extensions | PR 2 | based on PR 1; strict TDD per service |
| 3 | Controller, module wiring, app registration, verification | PR 3 | based on PR 2; no frontend work |

## Phase 1: Domain Foundation

- [x] 1.1 Add caregiver repository DI tokens to `src/domain/constants/tokens.ts`
- [x] 1.2 Create `CaregiverMother` entity with identity/lifecycle rules and tests
- [x] 1.3 Create `CaregiverHallAssignment` entity with `validFrom`/`validTo` and tests
- [x] 1.4 Create `CaregiverScheduleVersion` entity with blocks, days, tolerance, window and tests
- [x] 1.5 Create `CaregiverAttendanceRecord` entity for official/special marks and tests
- [x] 1.6 Create `CaregiverAttendanceException` entity for hall/caregiver justifications and tests
- [x] 1.7 Create `CaregiverAttendanceEvent` entity for rejected/special attempts and tests
- [x] 1.8 Define repository interfaces in `src/domain/repositories/caregiver-*.repository.ts`

## Phase 2: Persistence

- [x] 2.1 Write failing repository contract tests for the six new aggregates
- [x] 2.2 Create Mongoose schemas in `src/infrastructure/database/mongo/schemas/caregiver-*.schema.ts` with indexes
- [x] 2.3 Implement Mongo repositories in `src/infrastructure/database/mongo/repositories/caregiver-*-mongo.repository.ts`
- [x] 2.4 Register schemas and repositories in `src/infrastructure/database/mongo/mongo.module.ts`
- [x] 2.5 Make repository contract tests pass

## Phase 3: Application Services (TDD)

- [x] 3.1 Create DTOs and report response contracts in `src/application/dtos/caregiver-attendance/`
- [x] 3.2 Write failing tests for `CaregiverAttendanceScopeService` (admin/AT hall/committee checks)
- [x] 3.3 Implement `CaregiverAttendanceScopeService`
- [x] 3.4 Write failing tests for caregiver CRUD use cases (unique identity, transfers, history)
- [x] 3.5 Implement caregiver CRUD application service
- [x] 3.6 Write failing tests for schedule service (versions, blocks, copy)
- [x] 3.7 Implement schedule application service with copy-to-hall
- [x] 3.8 Write failing tests for marking service (self-service window, duplicates, assisted, corrections)
- [x] 3.9 Implement marking application service
- [x] 3.10 Write failing tests for exception service (hall holidays, caregiver justifications)
- [x] 3.11 Implement exception application service
- [x] 3.12 Write failing tests for monthly report calculator (historical assignment/schedule, tardiness, absences)
- [x] 3.13 Implement monthly report service for halls and committees

## Phase 4: Audit & Authorization Extensions

- [x] 4.1 Extend `AuditService` and `audit-event.schema.ts` to support `actorType` system/caregiver
- [x] 4.2 Emit audit events from assisted marks, corrections, duplicates, out-of-window, and special attempts
- [x] 4.3 Apply JWT guards/role decorators so admin manages all and AT is scoped to assigned halls/committees

## Phase 5: Infrastructure Wiring

- [x] 5.1 Create `CaregiverAttendanceController` with REST endpoints under `/caregiver-attendance`
- [x] 5.2 Create `CaregiverAttendanceModule` importing `DatabaseModule`, `AuthModule`, `AuditModule`
- [x] 5.3 Register `CaregiverAttendanceModule` in `src/app.module.ts`
- [x] 5.4 Write controller tests for DTO validation, public self-service route, and scoped access denials

## Phase 6: Verification

- [x] 6.1 Run unit tests: `pnpm test`
- [x] 6.2 Run linter: `pnpm lint`
- [x] 6.3 Run type check/build: `pnpm build`
- [x] 6.4 Validate OpenSpec change artifacts are consistent with implementation
- [x] 6.5 Add module-level comments and remove temporary scaffolding

## Phase 7: Pre-Archive Blocker Fixes

- [x] 7.1 Apply AT scope filtering to `CaregiverMotherService.findAll()` using accessible halls
- [x] 7.2 Apply AT scope filtering/denial to `CaregiverMotherService.findAssignments()`
- [x] 7.3 Add source hall scope check to `CaregiverMotherService.transfer()`
- [x] 7.4 Restore `package-lock.json` to avoid package manager drift
