# Tasks: Resolve communityHallId on Orphaned Migrated Children

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | ~150–190 (script ~110, spec ~60) |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | Single PR |
| Delivery strategy | single-pr |
| Chain strategy | n/a |

Decision needed before apply: No
Chained PRs recommended: No
400-line budget risk: Low

### Suggested Work Units

| Unit | Goal | Likely PR | Notes |
|------|------|-----------|-------|
| 1 | Backfill script + pure resolver unit test | PR 1 | Standalone migration, zero production-code deps. Tests included. |

## Phase 1: Resolver Logic (test-first)

- [x] 1.1 RED: Write `migration/scripts/backfill-community-hall-id.spec.ts` testing a pure exported function `resolveOrphans(orphans, halls)` (no DB):
  - single name match -> update op with `communityHallId` + `communityHallLocalId`
  - name not in halls -> counted unmatched (with name + count)
  - name mapping to >1 hall -> counted ambiguous, no update op, logged with hall count
  - orphans with empty/null name -> excluded from results
  - returns `{ ops, stats: { scanned, updated, unmatched, ambiguous }, unmatchedNames, ambiguousNames }`
- [x] 1.2 GREEN: In `migration/scripts/backfill-community-hall-id.ts`, implement and export the pure `resolveOrphans` function so 1.1 passes (no DB, no `mongoose` import in the pure path).

## Phase 2: Script Wiring (follows backfill-form-children-committee.ts conventions)

- [x] 2.1 Add the I/O wrapper in `migration/scripts/backfill-community-hall-id.ts`:
  - `mongoose.createConnection(mongoUri).asPromise()`; read `MONGODB_URI ?? DATABASE_URI`
  - load halls -> build `name -> { _id, localId }` map (detect ambiguity)
  - query orphans `{ communityHallId: null, communityHallName: { $nin: [null, ""] } }`
  - call `resolveOrphans`, then `childrenCol.bulkWrite(ops)` with `updateOne` ops
  - print summary (scanned / updated / unmatched / ambiguous + name lists)
  - `require.main === module` guard loading `dotenv` from `.env.<NODE_ENV>` then `.env`
  - ZERO imports from `src/`
- [x] 2.2 Add `DRY_RUN` support: when `process.env.DRY_RUN` is set, log the plan and skip `bulkWrite`.

## Phase 3: Verify

- [x] 3.1 Run unit test: `pnpm test backfill-community-hall-id` (Jest) — all scenarios green.
- [ ] 3.2 Dry-run against the target DB: `DRY_RUN=1 NODE_ENV=production npx ts-node migration/scripts/backfill-community-hall-id.ts` — confirm `updated` ≈ 140, ambiguous = 0, unmatched = 0.
- [ ] 3.3 Real run: `NODE_ENV=production npx ts-node migration/scripts/backfill-community-hall-id.ts` — confirm the reported counts match the dry run.
- [ ] 3.4 Idempotency check: re-run the real command — confirm `updated: 0`.
- [ ] 3.5 Confirm admin dashboard committee counts now include the previously dropped children.
