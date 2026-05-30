# Tasks: Unify Children by DNI with Excel Merge

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~950–1100 |
| 400-line budget risk | High |
| Chained PRs recommended | Yes |
| Suggested split | PR 1 → PR 2 → PR 3 → PR 4 |
| Delivery strategy | ask-on-risk |
| Chain strategy | pending |

Decision needed before apply: Yes
Chained PRs recommended: Yes
Chain strategy: pending
400-line budget risk: High

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | DNI normalizer + child schema/entity changes + repository port updates | PR 1 | Base: main. Independent slice — new utility + schema/entity foundation. Tests included. |
| 2 | New domain entities + repositories (child-history, import-error-log, findByLocalId/committeeId) | PR 2 | Base: main. New files only (no existing file mutation). Self-contained. |
| 3 | ChildService fullName concat + rewrite UpdateChildrenFromExcelUseCase + module wiring | PR 3 | Base: PR 2 branch. Depends on PR 1+2. Core merge logic, date merge, committee detection, error logging. |
| 4 | Migration script (backfill-unified-children.ts) + idempotency test | PR 4 | Base: main. Standalone script, zero production-code deps. |

## Phase 1: Foundation — DNI Normalizer & Schema

- [x] 1.1 RED: Write `src/common/utils/dni.spec.ts` — test normalizeDni: null/empty, non-digits, 7-digit pad, 8-digit, >8-digit rejection
- [x] 1.2 GREEN: Create `src/common/utils/dni.ts` with `normalizeDni(raw): string | null`
- [x] 1.3 Modify `src/infrastructure/database/mongo/schemas/child.schema.ts` — add `fullName`, `birthdayImported`, `admissionDateImported`, `gender`, `childCode`, `managementCommitteCode/Name`, `communityHallName`, `communityHallLocalId`; make `communityHallId` optional; add unique index on `documentNumber`
- [x] 1.4 Modify `src/domain/entities/child.entity.ts` — add new fields + `fullName`; update `create`, `fromPrimitives`, `toPrimitives`; retain `firstName`/`lastName`
- [x] 1.5 Modify `src/domain/repositories/child.repository.ts` — add `upsertByDni(dto): Promise<Child>`, `findByDocumentNumber(dni): Promise<Child | null>`; NOTE: kept findByDocumentNumberAndCommunnityHallId deprecated (removal deferred to Phase 3 — service still depends on it)
- [x] 1.6 Modify `src/domain/repositories/community-hall.repository.ts` — add `findByLocalId(localId: string): Promise<CommunityHall | null>`
- [x] 1.7 Modify `src/domain/repositories/committee.repository.ts` — add `findByCommitteeId(committeeId: string): Promise<Committee | null>`

## Phase 2: New Domain Entities & Repositories

- [x] 2.1 RED+GREEN: Create `src/domain/entities/child-history.entity.ts` — snapshot entity with `originalId`, `snapshotDate`, `reason`, all child fields
- [x] 2.2 RED+GREEN: Create `src/domain/entities/import-error-log.entity.ts` — error log entity with `errorCode`, `errorMessage`, `documentNumber`, ref fields, `loggedAt`
- [x] 2.3 Create `src/domain/repositories/child-history.repository.ts` — `save(snapshot): Promise<void>` append-only
- [x] 2.4 Create `src/domain/repositories/import-error-log.repository.ts` — `bulkSave(logs): Promise<void>` append-only
- [x] 2.5 Create `src/infrastructure/database/mongo/schemas/child-history.schema.ts` — Mongoose schema for `children_history`
- [x] 2.6 Create `src/infrastructure/database/mongo/schemas/import-error-log.schema.ts` — Mongoose schema for `import_error_logs`
- [x] 2.7 Create `src/infrastructure/database/mongo/repositories/child-history-mongo.repository.ts` — Mongo adapter implementing save
- [x] 2.8 Create `src/infrastructure/database/mongo/repositories/import-error-log-mongo.repository.ts` — Mongo adapter implementing bulkSave
- [x] 2.9 Modify `src/infrastructure/database/mongo/repositories/child-mongo.repository.ts` — implement `upsertByDni` with `findOneAndUpdate(upsert:true)`; implement `findByDocumentNumber` with communityHall lookup
- [x] 2.10 Modify `src/infrastructure/database/mongo/repositories/community-hall-mongo.repository.ts` — implement `findByLocalId(localId)`
- [x] 2.11 Modify `src/infrastructure/database/mongo/repositories/comittee-mongo.repository.ts` — implement `findByCommitteeId(committeeId)`
- [x] 2.12 Modify `src/domain/constants/tokens.ts` — add `CHILD_HISTORY_REPOSITORY`, `IMPORT_ERROR_LOG_REPOSITORY`

## Phase 3: Core Logic — ChildService & Use-Case Rewrite

- [x] 3.1 RED+GREEN: Modify `src/application/services/child.service.ts` — `create()` concatenates `firstName + lastName` → `fullName`; use `normalizeDni` on input; global DNI check via `findByDocumentNumber` (not scoped); set `birthdayImported`/`admissionDateImported` = null
- [x] 3.2 Write integration tests for `ChildService.create` — global DNI rejection, fullName concatenation, authoritative dates
- [x] 3.3 Rewrite `src/application/use-cases/alert-child/update-children-from-excel.use-case.ts` — merge-by-DNI: normalize, resolve refs, committee-change detection, non-destructive date merge, error logging
- [x] 3.4 Write unit tests for use-case: committee detection algorithm, date merge, hall-unresolved tolerant insert
- [x] 3.5 Write integration tests: full Excel import flow with in-memory Mongo
- [x] 3.6 Modify `src/infrastructure/database/mongo/mongo.module.ts` — registered ChildHistoryMongoRepository + ImportErrorLogMongoRepository + schemas; updated alert-child.controller.ts to use new use-case signature and ChildResponseDto

## Phase 4: Migration Script

- [ ] 4.1 RED: Write idempotency spec for migration script
- [ ] 4.2 Create `migration/scripts/backfill-unified-children.ts` — read children + alert_children, normalize DNIs, dedup merge (children authoritative, alert_children supplies Excel-only), bulk insert, create unique index
- [ ] 4.3 GREEN: Run migration spec — verify idempotency and source data preservation
