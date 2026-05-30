# Exploration: excel-import-dni-merge

## Current State

The backend maintains **two separate MongoDB collections** for child records:

- **`children`** — populated exclusively by the web form registration flow.
- **`alert_children`** — populated exclusively by the monthly Excel import flow.

There is **no cross-collection deduplication or upsert logic**. A child registered via form will NOT appear in `alert_children` until the following month's Excel regeneration, and vice-versa. This creates two parallel, disconnected datasets for the same real-world children.

### Affected Areas

- `src/infrastructure/database/mongo/schemas/child.schema.ts` — Mongoose schema for form children (`children` collection).
- `src/infrastructure/database/mongo/schemas/alert-child.schema.ts` — Mongoose schema for Excel children (`alert_children` collection).
- `src/domain/entities/child.entity.ts` — Domain entity for form children (firstName + lastName).
- `src/domain/entities/alert-child.entity.ts` — Domain entity for Excel children (fullName + gender + childCode + committee metadata).
- `src/application/services/child.service.ts` — Form registration service; writes to `ChildRepository` (`children`).
- `src/application/use-cases/alert-child/update-children-from-excel.use-case.ts` — Excel import use-case; writes to `AlertChildRepository` (`alert_children`).
- `src/infrastructure/excel/child-excel.parser.ts` — XLSX parser (`xlsx` library); maps Excel headers to `ChildExcelRow`.
- `src/infrastructure/database/mongo/repositories/child-mongo.repository.ts` — Mongo repository for `children`.
- `src/infrastructure/database/mongo/repositories/alert-child-monto.repository.ts` — Mongo repository for `alert_children`.
- `src/application/dtos/child/create-child.dto.ts` — Form input validation.
- `src/application/dtos/alert-child/bulk-update.dto.ts` — Excel upload input validation.
- `src/infrastructure/modules/child.module.ts` & `alert-child.module.ts` — Separate NestJS modules.

---

## 1. Current Child/Ficha Data Model

### Form collection: `children`
**Schema file:** `src/infrastructure/database/mongo/schemas/child.schema.ts`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `documentNumber` | `string` | Yes | 8 digits regex in DTO; **no DB uniqueness constraint** |
| `firstName` | `string` | Yes | Uppercased on input |
| `lastName` | `string` | Yes | Uppercased on input |
| `birthday` | `Date` | Yes | ISO 8601 from form |
| `admissionDate` | `Date` | Yes | ISO 8601 from form |
| `communityHallId` | `ObjectId` ref | Yes | Linked to `CommunityHall` |
| `userId` | `ObjectId` ref | Yes | Logged-in user |
| `createdAt` / `updatedAt` | implicit | — | `timestamps: true` |

**Collection name:** `children`  
**No indexes defined in schema.**

### Excel collection: `alert_children`
**Schema file:** `src/infrastructure/database/mongo/schemas/alert-child.schema.ts`

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `documentNumber` | `string` | Yes | Parsed from Excel; **no DB uniqueness constraint** |
| `fullName` | `string` | Yes | Concatenated: `{childNames} {fatherLastName} {motherLastName}` |
| `gender` | `string` | Yes | Normalized to `M`/`F` |
| `childCode` | `string` | Yes | Excel "Código de Usuario" |
| `admissionDate` | `Date` | Yes | Parsed from `dd/mm/yyyy` |
| `birthday` | `Date` | Yes | Parsed from `dd/mm/yyyy` |
| `managementCommitteName` | `string` | Yes | Excel "Nombre de Comité de Gestión" |
| `managementCommitteCode` | `string` | Yes | Excel "CUI del CG" (committee filter key) |
| `communityHallName` | `string` | Yes | Excel "Nombre del Local" |
| `communityHallId` | `string` | Yes | Excel `LOCAL_ID` |
| `userId` | `ObjectId` ref | Yes | Logged-in user |
| `createdAt` / `updatedAt` | implicit | — | `timestamps: true` |

**Collection name:** `alert_children`  
**No indexes defined in schema.**

---

## 2. FORM Registration Flow

**Endpoint:** `POST /children`  
**Controller:** `src/infrastructure/controllers/child.controller.ts` (lines 32-38)  
**Service:** `src/application/services/child.service.ts` (lines 35-76)

Steps:
1. Validate `communityHallId` exists via `CommunityHallRepository`.
2. **Duplicate check:** `childRepository.findByDocumentNumberAndCommunnityHallId(documentNumber, communityHallId)` — only checks within `children` collection.
3. If duplicate found → `ConflictException`.
4. Build `Child` domain entity with `firstName`, `lastName`, `birthday`, `admissionDate`, `communityHallId`, `userId`.
5. Save via `childRepository.save()` → inserts into `children`.
6. Record audit event `child.create`.

**Fields written:** `documentNumber`, `firstName`, `lastName`, `birthday`, `admissionDate`, `communityHallId`, `userId`.

---

## 3. EXCEL Import Flow

**Endpoint:** `POST /alert-child/bulk-update`  
**Controller:** `src/infrastructure/controllers/alert-child.controller.ts` (lines 37-73)  
**Use Case:** `src/application/use-cases/alert-child/update-children-from-excel.use-case.ts` (lines 35-155)  
**Parser:** `src/infrastructure/excel/child-excel.parser.ts` (uses `xlsx` library)

Steps:
1. Parse uploaded `.xls`/`.xlsx` via `XlsxChildExcelReader.read(file, committeeId)`.
2. Filter rows where `CUI del CG` (committee code) matches `committeeId`.
3. Map headers to `ChildExcelRow` interface (11 fields).
4. Fetch **all existing** `alert_children` for the current user: `alertChildRepository.findAllByUserId(userId)`.
5. For each Excel row:
   - Build `entityData` with concatenated `fullName`.
   - Check if `documentNumber` exists in the fetched `alert_children` list.
   - If exists → push to `toUpdate` (uses matched `id`).
   - If new → push to `toCreate`.
6. Execute `alertChildRepository.bulkUpdate(toUpdate)` and `bulkSave(toCreate)`.
7. Record audit events `alert-child.update` / `alert-child.create` with `source: 'excel-import'`.

**Current behavior:** Inserts into `alert_children` only. Never checks `children`. Never updates `children`.

---

## 4. Same Collection or Different?

**Different collections.** This is the root cause of the duplication problem.

| Aspect | Form (`children`) | Excel (`alert_children`) |
|--------|-------------------|--------------------------|
| Collection | `children` | `alert_children` |
| Repository | `ChildMongoRepository` | `AlertChildMongoRepository` |
| Service/UseCase | `ChildService` | `UpdateChildrenFromExcelUseCase` |
| Entity | `Child` (first/last name) | `AlertChild` (fullName + extra) |
| Deduplication scope | Within `children` only | Within `alert_children` only |

---

## 5. Field Origin Analysis

### Fields present in BOTH sources
- `documentNumber` (dedup key candidate)
- `birthday`
- `admissionDate`
- `communityHallId`
- `userId`

### Form-only fields (not in Excel)
- `firstName`
- `lastName`

### Excel-only fields (not captured by form)
- `fullName` (computed from Excel: names + fatherLastName + motherLastName)
- `gender`
- `childCode`
- `managementCommitteName`
- `managementCommitteCode`
- `communityHallName` (denormalized string from Excel)

**Merge policy implication:** If we unify, Excel should populate the Excel-only fields without overwriting form-only fields (`firstName`, `lastName`). Both should agree on shared fields (`documentNumber`, `birthday`, `admissionDate`, `communityHallId`).

---

## 6. Existing Dedup / Upsert / Uniqueness Logic

### Within `children` (form)
- **Duplicate check:** `findByDocumentNumberAndCommunnityHallId(documentNumber, communityHallId)` in `ChildService.create` (line 44).
- **Scope:** Per community hall. A child can be registered in multiple halls without conflict.
- **No DB unique index.**

### Within `alert_children` (Excel)
- **Duplicate check:** In-memory comparison in `UpdateChildrenFromExcelUseCase` (line 55): `existing.find(e => e.documentNumber === row.documentNumber)`.
- **Scope:** Per user (fetches all `alert_children` for the logged-in user).
- **Upsert behavior:** Updates existing `alert_children` records in place via `bulkUpdate`.
- **No DB unique index.**

### Cross-collection
- **None.** No query ever reads from both collections simultaneously for deduplication.

---

## 7. Test Setup

**Unit tests:**
- `src/application/services/child.service.spec.ts` — Jest unit tests for `ChildService.create`. Uses manually mocked repositories (`jest.Mocked<ChildRepository>`). No MongoDB test container; pure mocks.
- `src/domain/entities/child.entity.spec.ts` — Entity logic tests (admission windows, graduation).
- `src/domain/entities/alert-child.spec.ts` — Entity logic tests (alert signals).

**Test runner:** `pnpm test` (Jest 30, ts-jest, Node environment).  
**E2E:** `pnpm test:e2e` (config in `test/jest-e2e.json`). Currently only `test/app.e2e-spec.ts` exists.

**MongoDB in tests:** Not used in existing unit tests. If integration tests are needed, they would require either `mongodb-memory-server` or a Dockerized Mongo instance. Neither is currently configured.

---

## 8. Risks / Unknowns for Merge-by-DNI Approach

| Risk | Description | Severity |
|------|-------------|----------|
| **Field conflicts** | If a form child and Excel child have different `birthday` or `admissionDate` for the same DNI, which wins? | High |
| **Name format mismatch** | Form stores `firstName` + `lastName`; Excel stores `fullName`. Reconciliation logic needed. | Medium |
| **Community hall mismatch** | Form uses `ObjectId` ref; Excel uses string `LOCAL_ID`. Mismatches possible. | Medium |
| **Missing DNI in Excel** | Excel rows may have blank or malformed `documentNumber`. Current parser does not validate. | Medium |
| **DNI normalization** | Form validates `/^\d{8}$/`. Excel may contain leading zeros, spaces, or hyphens. | Medium |
| **Partial Excel rows** | Excel may omit some fields; upsert could nullify form-captured data if not careful. | High |
| **User scope isolation** | Both flows scope by `userId`. If a child moves between users, dedup logic must account for it. | Low |
| **Data migration** | Existing `alert_children` and `children` must be merged into a single collection. Backwards compatibility for APIs? | High |
| **Collection cleanup** | After migration, the old `alert_children` collection becomes dead data. | Low |

---

## Approaches Comparison

### Approach A: Upsert-by-DNI in Excel Import (Minimal Change)
Keep both collections but modify `UpdateChildrenFromExcelUseCase` so that before inserting into `alert_children`, it also checks `children` by `documentNumber`. If found in `children`, update the `children` record with Excel-only fields instead of creating an `alert_child`.

- **Pros:** Least invasive; no schema migration; `alert_children` can remain as a staging area.
- **Cons:** Two collections still exist; mental model remains fragmented; duplicate data still possible if logic drifts.
- **Effort:** Low

### Approach B: Unify Models First (Recommended Direction)
Create a single `children` schema that includes all fields (form + Excel). Migrate `alert_children` data into `children`. Update Excel import to upsert into the unified collection. Update form DTO/service to tolerate the new fields.

- **Pros:** Single source of truth; eliminates conceptual duplication; aligns with user's stated direction.
- **Cons:** Requires data migration; larger blast radius; need to handle `firstName`/`lastName` vs `fullName` reconciliation.
- **Effort:** Medium–High

### Approach C: Separate Staging + Merge Job
Keep `alert_children` as a raw staging table. Import Excel there unchanged. Run a background/scheduled job that merges `alert_children` into `children` by DNI, filling in Excel-only fields.

- **Pros:** Decouples import from merge; allows human review before merge; preserves raw Excel data.
- **Cons:** Adds infrastructure (job scheduler); latency between import and merge; still two collections.
- **Effort:** Medium

---

## Recommendation

**Approach B (Unify Models First)** is the cleanest long-term solution and matches the user's explicit intent. However, it must be executed in phases:

1. **Phase 1 — Schema unification:** Extend `Child` schema/entity to optionally hold Excel-only fields (`gender`, `childCode`, `managementCommitteName`, `managementCommitteCode`, `communityHallName`, `fullName`).
2. **Phase 2 — Upsert logic:** Replace `UpdateChildrenFromExcelUseCase` to target `ChildRepository` with upsert-by-`documentNumber`.
3. **Phase 3 — Data migration:** Backfill existing `alert_children` into `children`, then deprecate `alert_children`.
4. **Phase 4 — Cleanup:** Remove `alert_children` collection, schema, repository, and module once confirmed stable.

Before proceeding, the team must decide:
- How to handle `fullName` vs `firstName`/`lastName` (store both? derive one from the other?)
- Which source wins when shared fields (`birthday`, `admissionDate`) differ.
- Whether to add a DB unique index on `(documentNumber, communityHallId)` or just `documentNumber`.

---

## Ready for Proposal

**Yes.** The exploration has identified the root cause (dual collections), mapped all affected files, compared viable approaches, and surfaced the critical open questions. The orchestrator can now move to the **Proposal** phase, asking the user to confirm:

1. Do they want to proceed with unifying into a single collection?
2. What is the merge policy for conflicting shared fields?
3. How should `fullName` be reconciled with `firstName`/`lastName`?
