---
title: Excel import does not record per-row audit events
status: resolved
labels: [audit, excel-import, regression]
created_at: 2026-05-30
resolved_at: 2026-05-30
resolution: Fixed within the excel-import-dni-merge change (Phase 3 branch, commit 354f20e). UpdateChildrenFromExcelUseCase re-injects AuditService and records child.create / child.update / child.skip / child.save-with-warnings per row with source 'excel-import'. Covered by 5 unit tests.
---

# Excel import does not record per-row audit events

## Description
The `excel-child-import` spec (Import Audit Trail requirement, `openspec/changes/excel-import-dni-merge/specs/excel-child-import/spec.md` lines 131–149) requires that each row processed during an Excel import records an audit event distinguishing inserts, updates, and skipped rows:

- `child.create` for new inserts
- `child.update` for matched updates
- `child.skip` for excluded rows (e.g. invalid DNI)
- `child.save-with-warnings` for rows saved with unresolved references

…all with `source: 'excel-import'`.

The Phase 3 rewrite of `UpdateChildrenFromExcelUseCase` does **not** inject `AuditService` and emits no audit events. This was surfaced by `sdd-verify` on Phase 3 (finding W2).

**This is a REGRESSION, not just a missing feature.** The pre-Phase-3 implementation on `master` already recorded audit events: it injected `AuditService` and called `auditService.recordMany(...)` with actions `alert-child.create` / `alert-child.update` and `metadata: { source: 'excel-import' }`. The Phase 3 unified rewrite replaced the entire use-case and dropped that audit recording. So Excel-import audit coverage went from **present (working)** to **absent**.

Scope note: it was out of scope for Phase 3 as written — the audit requirement was never broken into a Phase 3 task (`tasks.md` 3.1–3.6 omit it). But because it regresses working behavior AND the spec mandates it, it should be prioritized.

The new flow writes to the unified `children` collection, so the restored audit must use the new action vocabulary (`child.create` / `child.update` / `child.skip` / `child.save-with-warnings`) rather than the old `alert-child.*` actions.

Note: `ChildService.create/update/delete` already record audit events; the gap is specific to the Excel import use-case.

## Acceptance Criteria
- [ ] `UpdateChildrenFromExcelUseCase` injects `AuditService` (or the audit port) and records one audit event per row.
- [ ] Event action reflects outcome: `child.create` (insert), `child.update` (matched update), `child.skip` (excluded, e.g. invalid DNI), `child.save-with-warnings` (saved with unresolved refs / error logs).
- [ ] Every event carries `source: 'excel-import'`.
- [ ] Rows saved with warnings appear as `child.save-with-warnings` AND still produce `import_error_logs` entries (counts reconcile).
- [ ] Unit tests cover each action mapping (insert / update / skip / save-with-warnings).

## Implementation Notes
- Decide the audit boundary: the use-case can determine insert-vs-update by whether `findByDocumentNumber` returned an existing record before `upsertByDni`.
- `save-with-warnings` correlates with a non-empty `errorLogs[]` for the row.
- Consider threading the same `importBatchRef` (file name) used by `import_error_logs` into the audit metadata for cross-referencing.
- Related deferred item: task 3.5 integration tests (in-memory Mongo) — see `tasks.md`.
