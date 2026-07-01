# Proposal: Caregiver Attendance

## Intent

Add backend support for attendance of caregiver mothers, not system users. The module must preserve historical Community Hall assignments and schedule versions so reports remain correct when caregivers move halls or schedules change.

## Scope

### In Scope
- Manage caregiver mother identity, lifecycle dates, and versioned Community Hall assignments.
- Configure reusable, versioned Community Hall attendance schedules with working days, special days, blocks, tolerance, and marking windows.
- Support self-service marks by caregiver document only, plus assisted AT/admin marks, corrections, exceptions, audit events, and monthly reports.

### Out of Scope
- Frontend screens and UX flows.
- Final report export formatting beyond backend response contracts.
- Exit marks as required attendance; `exitRequired` remains false initially.

## Capabilities

### New Capabilities
- `caregiver-attendance`: Caregiver mother registration, assignment history, schedule configuration, attendance marking, exceptions, auditability, and reports.

### Modified Capabilities
- None.

## Approach

Implement a NestJS module following existing Clean/Hexagonal patterns: domain entities and repository interfaces, Mongoose schemas/repositories, DTOs, application services, controller, DI tokens, module wiring, and app registration. Use JWT authorization: admin manages all; AT users are scoped to assigned Management Committees/Community Halls. Use `AuditService` for assisted marks, corrections, duplicates, out-of-window attempts, and special events.

Model caregiver document type+number as globally unique. Store assignment history and schedule versions; attendance and reports must resolve the active assignment/schedule for each attendance date. Self-service resolves caregiver and hall from document input; callers must not send `communityHallId`.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `src/domain` | New | Caregiver, assignment, schedule, attendance, exception entities/contracts. |
| `src/application` | New | Use cases for registration, schedules, marks, corrections, reports. |
| `src/infrastructure` | New | Mongo schemas, repositories, controller, module, DTO validation. |
| `src/common/audit` | Modified | Record assisted/correction/special attendance events through existing audit service. |
| `src/app.module.ts` | Modified | Register caregiver attendance module. |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Historical reports drift after assignment/schedule changes | Med | Version assignments and schedules; query by effective date. |
| AT scope leaks cross-hall data | Med | Centralize authorization checks against assigned committees/halls. |
| Absence rules overcount expected caregivers | Med | Require explicit report parameter for expected-without-marks inclusion. |

## Rollback Plan

Remove the new module registration and related files. Drop newly-created caregiver attendance collections only if no production marks must be preserved; otherwise keep collections read-only for audit/export.

## Dependencies

- Existing JWT auth, AT assignment/CommitteeMembership model, Community Hall and Management Committee data, MongoDB, `AuditService`.

## Success Criteria

- [ ] Self-service accepts valid in-window entry marks and blocks retired caregivers, non-working days, holidays/days off, missing schedules, duplicates, and out-of-window attempts.
- [ ] Assisted AT/admin flows record performer, timestamp, reason, before/after where relevant, and audit events.
- [ ] Monthly Community Hall and Management Committee reports use historical assignment and schedule versions.
- [ ] Strict TDD is followed during implementation.

## Open Questions

- Should self-service accept document type plus number, or default to DNI-only when type is omitted?
- What exact report parameter should include expected caregivers without marks?
- Which holiday/day-off and permission types apply to hall-level versus individual caregiver exceptions?
