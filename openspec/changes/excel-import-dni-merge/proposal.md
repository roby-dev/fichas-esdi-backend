# Proposal: Unify Children by DNI with Excel Merge

## Intent

Today `children` (web form) and `alert_children` (Excel import) are two disconnected collections for the same real children. Neither flow checks the other, so a form-registered child stays invisible to imports until the next monthly file — causing divergence and duplicate records. We unify both into one DNI-keyed source of truth.

## Scope

### In Scope
- Single unified collection keyed by `documentNumber` (DNI), used by BOTH form and Excel flows.
- Single `fullName` field; form concatenates `firstName + lastName` at the DB layer (form UI unchanged).
- Non-destructive date merge: Excel dates that differ go to `birthdayImported` / `admissionDateImported`; form values stay source of truth.
- UNIQUE index on `documentNumber` in the active collection.
- Committee-change history: on Comité change, snapshot old record to `children_history`, then update active.
- Excel import becomes the merge entry point (match by DNI → update/insert).
- Data migration of existing `children` + `alert_children` into the unified collection.

### Out of Scope (deferred to design/tasks)
- Bulk/batch performance optimization for large imports.
- Removing the legacy `alert_children` module after stabilization (cleanup follow-up).

## Capabilities

### New Capabilities
- `child-history`: archive of a child's previous Comité before each committee change (`children_history`).

### Modified Capabilities
- `child-registration`: form persists a single `fullName` (concatenated) into the unified collection.
- `excel-child-import`: imports merge by DNI into the unified collection with date-merge + committee-history rules.

## Approach

DNI is the natural key. Unify on one `fullName`. Excel is the merge entry point: per row, match by `documentNumber`; if found, update Excel-only fields, apply non-destructive date merge, and if `managementCommitteCode`/`managementCommitteName` differs from stored, archive the existing record to `children_history` then update active; if not found, insert. A unique index on `documentNumber` enforces one active record per child.

## Affected Areas

| Area | Impact | Description |
|------|--------|-------------|
| `child.schema.ts` | Modified | Add `fullName`, Excel-only fields, `birthdayImported`, `admissionDateImported`, unique `documentNumber` index |
| `children_history` schema | New | Snapshot of previous Comité per change |
| `child.service.ts` | Modified | Concatenate names → `fullName`; resolve against unified collection |
| `update-children-from-excel.use-case.ts` | Modified | Merge-by-DNI: date-merge + committee-history rules |
| `child-mongo.repository.ts` | Modified | Upsert-by-DNI, archive-on-committee-change |
| `child-excel.parser.ts` | Modified | DNI normalization/validation before match |
| Data migration | New | Backfill `children` + `alert_children` into unified collection |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Unique index fails on existing duplicate DNIs | High | Normalize + dedup during migration BEFORE adding index |
| DNI normalization mismatch (leading zeros/spaces) | Med | Normalize to `/^\d{8}$/` on both write paths |
| Concurrent imports race on same DNI | Med | Atomic upsert + transactional archive-then-update |
| Downstream readers expect `firstName`/`lastName` | Med | Keep form fields or derive; audit consumers in design |
| Committee field name ambiguity | Med | Confirm `managementCommitteName`/`managementCommitteCode` as Comité key |

## Rollback Plan

Migration runs as a separate idempotent step that writes to the unified collection without deleting source data; legacy `children`/`alert_children` remain untouched until verified. To roll back: drop unique index, repoint flows to legacy collections, discard unified collection. No source data is destroyed.

## Verified Domain Facts (committee resolution)

Committee ("Comité") is resolved DIFFERENTLY in each flow (verified in schemas):

- Form (`children`): indirect — `child.communityHallId` (ObjectId) -> `community_halls.committeeRef` (ObjectId) -> `committees.committeeId` (string code). `community_halls` also has `localId` (business code).
- Excel (`alert_children`): flat strings on the row — `managementCommitteCode` + `managementCommitteName`, and `communityHallId` (string) + `communityHallName`.

Implications for the merge:
- Committee-change detection = resolve the stored child's committee (`communityHall.committeeRef` -> `committees.committeeId`) and compare against the Excel row's `managementCommitteCode`. If they differ -> archive to `children_history` then update.
- Identifier translation required: Excel `managementCommitteCode` <-> `committees.committeeId`; Excel `communityHallId` (string) <-> likely `community_halls.localId` (NEEDS verification against the import parser/data).

## Dependencies

- Canonical Comité key for change detection CONFIRMED: `committees.committeeId` (form, via `communityHall.committeeRef`) compared to Excel `managementCommitteCode`.
- CONFIRMED: matching is by BUSINESS CODE, never Mongo `_id`. Excel `communityHallId` -> `community_halls.localId`; Excel `managementCommitteCode` -> `committees.committeeId`.
- Decision on DB index strategy: `documentNumber` global vs scoped.

## Success Criteria

- [ ] One active record per DNI; form + Excel both resolve against it.
- [ ] Form-originated `birthday`/`admissionDate` never overwritten by Excel.
- [ ] Comité change archives prior record to `children_history`.
- [ ] Unique index on `documentNumber` active without migration errors.

## Open Questions for Design

- DNI normalization rules before uniqueness (leading zeros, spaces, hyphens)?
- Backfill order and dedup policy when existing `children`/`alert_children` already conflict on DNI?
- Should `firstName`/`lastName` remain stored alongside `fullName` for downstream consumers, or be derived?
- Exact Comité field used for change detection and what `children_history` retains.
