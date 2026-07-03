# Tasks: Caregiver Current Hall in List Response

## Review Workload Forecast

| Field | Value |
|-------|-------|
| Estimated changed lines | 200–260 (incl. unit tests) |
| 400-line budget risk | Low |
| Chained PRs recommended | No |
| Suggested split | single PR (delivery strategy: single-pr) |
| Delivery strategy | single-pr |
| Chain strategy | size-exception |

Decision needed before apply: No
Chained PRs recommended: No
Chain strategy: size-exception
400-line budget risk: Low

## Phase 1: Backend Foundation — Repository Batch Accessors

- [x] 1.1 Add `findCurrentByCaregiverIds(ids: string[]): Promise<CaregiverHallAssignment[]>` to `caregiver-hall-assignment.repository.ts`.
- [x] 1.2 (TDD RED→GREEN) Implement Mongo query `{ caregiverId: { $in }, validTo: null }` in `caregiver-hall-assignment-mongo.repository.ts`; short-circuit on empty `ids`.
- [x] 1.3 Add `findByIds(ids: string[]): Promise<CommunityHall[]>` to `community-hall.repository.ts` (interface only).
- [x] 1.4 (TDD RED→GREEN) Implement `_id: { $in }` lookup in `community-hall-mongo.repository.ts`; populate `committeeRef`; reuse `toDomain`; short-circuit on empty `ids`.
- [x] 1.5 Repository unit specs for both implementations using mocked Mongoose chains (no real DB).

## Phase 2: Backend Core — DTO Enrichment

- [x] 2.1 Add nullable `currentHallId` and `currentHallName` to `CaregiverMotherResponseDto` with Swagger `@ApiProperty({ nullable: true })`.
- [x] 2.2 Extend `fromDomain` factory signature to accept optional `{ currentHallId, currentHallName }` argument; keep backwards-compatible.
- [x] 2.3 Add private `enrichWithCurrentHalls(caregivers)` helper in `caregiver-mother.service.ts` (one batch assignment call + one batch hall call; build `Map<caregiverId, CurrentHall>`).
- [x] 2.4 Call helper from `findAll()` and `findById()` before DTO mapping; return `null` fields when no active assignment.
- [x] 2.5 (TDD RED→GREEN) Service unit tests: admin path, AT path, null fallback, single-caregiver `findById`, AT scope filter still runs first.

## Phase 3: Frontend — Interface + Template

- [x] 3.1 Add `currentHallId: string | null` and `currentHallName: string | null` to `CaregiverMotherResponse` in `caregiver-mother.interface.ts`.
- [x] 3.2 Insert `<th>Local comunal</th>` between "Nombre completo" and "Teléfono" in `caregiver-management.component.html`.
- [x] 3.3 Add matching `<td>{{ caregiver.currentHallName ?? '-' }}</td>` in the row body; do not transform DTO dates.
- [x] 3.4 Bump empty-state `colspan` from `7` to `8`.
- [x] 3.5 Extend frontend spec: assert column header text, dash fallback for null `currentHallName`, and `colspan="8"` on empty-state row.

## Phase 4: Verification

- [x] 4.1 Backend: `pnpm test && pnpm build` green; coverage ≥ 80% on touched files per `openspec/config.yaml`.
- [x] 4.2 Frontend: `pnpm build` + targeted Karma spec for the management component.
- [x] 4.3 Run all delta spec scenarios (5 backend + 3 frontend) and confirm list endpoint issues ≤ 2 extra queries (assignments + hall names).
