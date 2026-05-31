# Proposal: Resolve communityHallId on Orphaned Migrated Children

## Intent

The admin dashboard (`GET /api/v1/admin/dashboard/stats`) undercounts children per committee. 140 children in the `children` collection have `communityHallId: null`, so the committee/hall resolution — which depends on the `communityHallId -> community_halls.committeeRef` FK — silently drops them. We restore those FKs with a single idempotent backfill script so every child resolves to its committee.

## Problem Statement

- The Excel import is ALREADY correct. `src/application/use-cases/alert-child/update-children-from-excel.use-case.ts:142` resolves the hall via `hallRepository.findByLocalId(row.communityHallId)` and persists `hall?.id` at line 294. NO application code change is needed.
- The 140 broken records are HISTORICAL ORPHANS migrated from the old `alert_children` collection (`migration/scripts/backfill-unified-children.ts:202`), predating that resolution logic. They carry `_migratedAt`.
- VERIFIED PRODUCTION DATA (`children` collection, MongoDB Compass): of the 140 orphans, **0 have `communityHallLocalId`** (all null) and **140 have only `communityHallName`**. A backfill keyed on `localId` would therefore fix ZERO records. The ONLY viable match key is `communityHallName -> community_halls.name`.
- VERIFIED no ambiguity: all 140 resolve to exactly one matching hall (`hallsMatched: 1`):
  - `"LOCAL - PAN DE VIDA"` = 56
  - `"VIRGEN DE PALLAGUA"` = 32
  - `"LOCAL COMUNAL JOVENES UNIDOS DEL SUR"` = 28
  - `"LOCAL COMUNAL CONSTRUCCION CIVIL"` = 24
- `community_halls.name` and `.localId` have NO unique index (schema only `required: true`). Current data is clean, but name-keyed matching is theoretically fragile for future halls sharing a name — hence the explicit ambiguous-name skip+log below.

## Key Decision

Match orphans by `communityHallName -> community_halls.name`, not by `localId` (which is null for 100% of orphans). When resolved, set BOTH `communityHallId = hall._id` AND `communityHallLocalId = hall.localId` — backfilling the localId too future-proofs these records so later resolution paths (which prefer localId) also succeed.

## Scope

### In Scope
- A single one-shot, idempotent backfill script: `migration/scripts/backfill-community-hall-id.ts`, following the EXACT conventions of `migration/scripts/backfill-form-children-committee.ts` (`mongoose.createConnection`, `dotenv` inside the `require.main === module` guard, ZERO imports from `src/`, `bulkWrite` with `updateOne` ops, summary logging).
- Name-keyed resolution with ambiguous-name detection (skip + log, never guess).
- A summary report: scanned, updated, unmatched, ambiguous (with names + counts).
- An opt-in `DRY_RUN` env flag that logs the plan without writing.

### Out of Scope
- NO change to the Excel import use-case (`update-children-from-excel.use-case.ts`) — it is already correct.
- NO schema change (no new unique index on `community_halls.name`).
- The denormalized-code fallback in `src/application/services/admin-dashboard.service.ts` is NOT removed here. Once this backfill runs it becomes redundant, but leaving it as defense-in-depth is an apply-phase decision.

## Capabilities

### New Capabilities
- `community-hall-backfill`: a one-shot migration that resolves `communityHallId` (and `communityHallLocalId`) on orphaned migrated children via `communityHallName -> community_halls.name`.

## Approach

Per run:
1. Build a `name -> { _id, localId }` map from `community_halls` once. Names mapping to >1 hall are recorded as ambiguous.
2. Query orphans: `{ communityHallId: null, communityHallName: { $nin: [null, ""] } }`.
3. For each orphan whose `communityHallName` matches a single hall, queue an `updateOne` setting `communityHallId` and `communityHallLocalId`.
4. Skip orphans whose name is ambiguous or unmatched; record them for the report.
5. Apply queued ops via `bulkWrite` (or log the plan only when `DRY_RUN` is set).
6. Print a summary: scanned, updated, unmatched (with names + counts), ambiguous (with names + counts).

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `migration/scripts/backfill-community-hall-id.ts` | New | One-shot idempotent backfill, name-keyed, dry-run capable |
| `migration/scripts/backfill-community-hall-id.spec.ts` | New | Unit test for the pure `name -> hall` mapping / resolution logic |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Future hall shares a name with another, producing a bad FK | Low | Ambiguous names detected up front and SKIPPED + logged; never guessed |
| Orphan name not present in `community_halls` | Low (0 today) | Counted as unmatched and reported; row left untouched |
| Accidental over-write of already-resolved rows | None | Target query excludes rows where `communityHallId` is set |

## Rollback Plan

The script only sets `communityHallId`/`communityHallLocalId` on rows that previously had `communityHallId: null`. To roll back, set those two fields back to null on rows updated in the run (identifiable by the affected `_id`s logged during the run). No data is deleted.

## Idempotency

Re-running after a successful run updates 0 rows because the target query (`communityHallId: null`) no longer matches the resolved orphans. Safe to run repeatedly.

## Success Criteria

- [x] All 140 orphans (or all that name-match a single hall) have `communityHallId` and `communityHallLocalId` set.
- [x] Admin dashboard committee counts include the previously dropped children.
- [x] Ambiguous and unmatched names are reported, never guessed.
- [x] `DRY_RUN=1` logs the plan and writes nothing.
- [x] A second run reports 0 updated.
