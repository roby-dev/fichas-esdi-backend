# Design: Unify Children by DNI with Excel Merge

## Technical Approach

Extend the `children` collection to be the single DNI-keyed source of truth. Both form (`ChildService.create`) and Excel import (`UpdateChildrenFromExcelUseCase`) write there. Match by normalized DNI (`/^\d{8}$/`). Form dates are authoritative; diverging Excel dates go to `birthdayImported`/`admissionDateImported`. Committee change detection snapshots the prior record to `children_history` before updating. Tolerant import: unresolved references still save the child, with errors logged to `import_error_logs`.

## Architecture Decisions

| Decision | Choice | Alternatives | Rationale |
|----------|--------|-------------|-----------|
| Unified DNI index | Global UNIQUE on `documentNumber` | Scoped `(documentNumber, communityHallId)` | DNI is the national ID. A child has one DNI, period. Scoped would reintroduce duplicates across halls. |
| `firstName`/`lastName` retention | Keep alongside `fullName` | Derive from `fullName` on read | Downstream consumers (`toPrimitives`, DTOs, API responses) expect both. Splitting "MARIA GONZALEZ" back into first/last is lossy and locale-ambiguous. |
| `communityHallId` type split | Keep ObjectId ref; add `communityHallLocalId: string` for Excel raw value | Make `communityHallId` a raw string, drop ObjectId | Form flow relies on ObjectId refs for aggregation (`findAllByCommittee`). Breaking that costs more than adding one field. |
| Atomic snapshot-then-update | Two-step with compensation (snapshot → update; if update fails, snapshot stays as valid history) | MongoDB transaction with abort-on-failure | The spec allows orphan snapshots (Scenario: snapshot succeeds, update fails). Two-step is simpler, avoids Mongoose transaction setup, and orphan snapshots are acceptable (documented historical state). Mongoose transactions add complexity for a rare failure edge case. |
| Concurrency guard | `findOneAndUpdate` with `upsert: true` + unique index | Application-level lock or `bulkWrite` with ordered ops | The unique index already rejects duplicate inserts atomically. `findOneAndUpdate` with `upsert` is a single atomic operation — two concurrent imports on the same DNI race cleanly (exactly one record). |
| DNI normalizer placement | Single shared pure function in `src/common/utils/dni.ts` | Inline in each use-case | Two write paths, one normalization rule. Shared function prevents drift. Both form DTO and Excel parser delegate to it. |

## Data Flow

```
Excel upload → XlsxChildExcelReader (parse rows)
    │
    ▼
UpdateChildrenFromExcelUseCase
    │
    ├─ normalizeDNI(row.documentNumber) → match key
    ├─ CommunityHallRepository.findByLocalId(row.communityHallId) → ObjectId | null
    ├─ CommitteeRepository.findByCommitteeId(row.managementCommitteCode) → Committee | null
    │
    ├─ ChildRepository.findByDocumentNumber(normalized) → existing? ────┐
    │                                                                    │
    ▼ MATCH FOUND                                                        ▼ NOT FOUND
    ├─ resolve stored committee: communityHall → committeeRef → committeeId
    ├─ compare with row.managementCommitteCode
    ├─ if CHANGED: snapshot to children_history → update active
    ├─ if SAME: update Excel-only fields (gender, childCode, fullName, ...)
    ├─ non-destructive date merge: birthdayImported / admissionDateImported
    └─ log import_error_logs entries for unresolved refs
                                  │
    ▼ INSERT (not found)          ▼
    ChildRepository.upsertByDni() ──→ unified `children` (MongoDB)
```

## File Changes

| File | Action | Description |
|------|--------|-------------|
| `src/common/utils/dni.ts` | **Create** | `normalizeDni(raw: string): string \| null` — strips non-digits, pads to 8; returns null if invalid |
| `src/infrastructure/database/mongo/schemas/child.schema.ts` | **Modify** | Add `fullName`, `birthdayImported`, `admissionDateImported`, `gender`, `childCode`, `managementCommitteCode/Name`, `communityHallName`, `communityHallLocalId`; make `communityHallId` optional; add unique index on `documentNumber` |
| `src/infrastructure/database/mongo/schemas/child-history.schema.ts` | **Create** | Snapshot schema: all child fields + `originalId`, `snapshotDate`, `reason` |
| `src/infrastructure/database/mongo/schemas/import-error-log.schema.ts` | **Create** | `errorCode`, `errorMessage`, `documentNumber`, `fullName`, `childCode`, `managementCommitteCode/Name`, `communityHallId/Name`, `importBatchRef`, `loggedAt` |
| `src/domain/entities/child.entity.ts` | **Modify** | Add new fields to entity, `fromPrimitives`, `toPrimitives`, `create` factory |
| `src/domain/entities/child-history.entity.ts` | **Create** | Snapshot domain entity |
| `src/domain/entities/import-error-log.entity.ts` | **Create** | Error log domain entity |
| `src/domain/repositories/child.repository.ts` | **Modify** | Add `upsertByDni`, `findByDocumentNumber` (already exists), remove `findByDocumentNumberAndCommunnityHallId` |
| `src/domain/repositories/child-history.repository.ts` | **Create** | `save(snapshot)` — append-only |
| `src/domain/repositories/import-error-log.repository.ts` | **Create** | `bulkSave(logs)` — append-only |
| `src/domain/repositories/community-hall.repository.ts` | **Modify** | Add `findByLocalId(localId: string)` |
| `src/domain/repositories/committee.repository.ts` | **Modify** | Add `findByCommitteeId(committeeId: string)` |
| `src/domain/constants/tokens.ts` | **Modify** | Add `CHILD_HISTORY_REPOSITORY`, `IMPORT_ERROR_LOG_REPOSITORY` |
| `src/infrastructure/database/mongo/repositories/child-mongo.repository.ts` | **Modify** | Implement `upsertByDni` with atomic `findOneAndUpdate(upsert:true)`, `findByDocumentNumber` with communityHall lookup for committee resolution |
| `src/infrastructure/database/mongo/repositories/child-history-mongo.repository.ts` | **Create** | Mongo adapter for `children_history` |
| `src/infrastructure/database/mongo/repositories/import-error-log-mongo.repository.ts` | **Create** | Mongo adapter for `import_error_logs` |
| `src/infrastructure/database/mongo/repositories/community-hall-mongo.repository.ts` | **Modify** | Add `findByLocalId` |
| `src/infrastructure/database/mongo/repositories/committee-mongo.repository.ts` | **Modify** | Add `findByCommitteeId` |
| `src/application/services/child.service.ts` | **Modify** | Concatenate `fullName` at create; use global DNI duplicate check; use `normalizeDni` |
| `src/application/use-cases/alert-child/update-children-from-excel.use-case.ts` | **Rewrite** | Merge-by-DNI: normalize, resolve refs, committee-change detection, date merge, error logging. Target `ChildRepository` not `AlertChildRepository`. |
| `src/infrastructure/modules/child.module.ts` | **Modify** | Register new repositories, updated use-case |
| `migration/scripts/backfill-unified-children.ts` | **Create** | Idempotent migration: dedup + merge `children` + `alert_children` into unified collection, then create unique index |

## Interfaces / Contracts

**DNI normalizer** (single source of truth):
```ts
// src/common/utils/dni.ts
function normalizeDni(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const digits = String(raw).replace(/\D/g, '');
  if (digits.length > 8 || digits.length === 0) return null;
  return digits.padStart(8, '0'); // "1234567" → "01234567"
}
```

**Committee-change detection algorithm**:
1. Find existing child by `documentNumber` via `ChildRepository`
2. Resolve stored committee: lookup `community_halls` by child's `communityHallId` ObjectId → get `committeeRef` ObjectId → lookup `committees` by `_id` → get `committeeId` string
3. Compare: `storedCommitteeId === row.managementCommitteCode`
4. If different: snapshot child record → `children_history` (all fields + `snapshotDate: now`, `reason: "committee_change"`, `originalId: child._id`), then update child with new committee metadata
5. If `communityHallId` is null (unresolved hall): skip detection, log `COMMITTEE_DETECTION_SKIPPED`

**Upsert-by-DNI** (atomic):
```ts
await this.model.findOneAndUpdate(
  { documentNumber: normalizedDni },
  { $set: updateFields, $setOnInsert: insertFields },
  { upsert: true, new: true, runValidators: true }
);
```

## Testing Strategy

| Layer | What to Test | Approach |
|-------|-------------|----------|
| Unit | `normalizeDni` edge cases | Jest — all valid/invalid inputs, padding, trimming |
| Unit | Committee change detection logic | Jest — mock repositories, verify snapshot created or skipped |
| Unit | Date merge (same/different/null) | Jest — pure function, no DB |
| Integration | `ChildMongoRepository.upsertByDni` | `@nestjs/testing` + `mongodb-memory-server` — verify atomicity, unique index enforcement |
| Integration | Full Excel import flow (match/insert/snapshot/log) | Jest — mock parser, real in-memory Mongo |
| Integration | Form `create` with global DNI rejection | Jest — verify conflict on duplicate DNI |
| E2E | Migration script idempotency | Jest — run twice, verify idempotent; source data intact |

## Migration / Rollout

**Migration script** (`migration/scripts/backfill-unified-children.ts`):
1. Read all `children` + `alert_children`
2. Normalize every `documentNumber` via `normalizeDni`; skip + log invalid DNIs
3. Build DNI-indexed map; for duplicates (same DNI in both collections): merge — `children` fields authoritative (firstName, lastName, birthday, admissionDate, communityHallId); `alert_children` supplies Excel-only fields (fullName, gender, childCode, managementCommitteCode/Name, communityHallName, communityHallLocalId)
4. Bulk insert into `children` collection using `insertMany` with `ordered: false` (skip duplicates, report conflicts)
5. After insert: `this.model.collection.createIndex({ documentNumber: 1 }, { unique: true })`
6. Run verification: `count(children) === count(children_source) + count(alert_children_source) - dedup_overlaps`

The script is idempotent — re-running skips already-migrated DNIs. Original `alert_children` collection is untouched (rollback: drop unified collection, repoint flows).

**Deferred**: Bulk/batch performance optimization is a follow-up change. The initial import processes rows sequentially with one `findOneAndUpdate` per DNI.

## Open Questions

- [ ] Should the `communityHallId` required constraint be relaxed to `required: false` for Excel-only children with unresolved halls? (Design says **yes** — this is the resolution.)
- [ ] Post-migration: when to drop the `alert_children` collection? (Out of scope — cleanup follow-up.)

## Risks

- **Unique index creation fails if migration dedup misses a duplicate**: Mitigated by `insertMany({ ordered: false })` + pre-index `countDocuments` verification.
- **Committee resolution for form children requires two DB lookups per matched row**: Accepted tradeoff; bulk lookup optimization deferred.
- **Downstream readers of `firstName`/`lastName`**: Both fields retained — no breakage.
