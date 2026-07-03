# Apply Progress: Caregiver Current Hall

**Change**: `caregiver-current-hall`
**Artifact store**: OpenSpec
**Mode**: Backend Strict TDD; Frontend Standard Mode
**Delivery**: single-pr, `size-exception` accepted

## Completed Tasks

- [x] 1.1 Add `findCurrentByCaregiverIds` to `CaregiverHallAssignmentRepository`.
- [x] 1.2 Implement current assignment Mongo lookup with empty-list short-circuit.
- [x] 1.3 Add `findByIds` to `CommunityHallRepository`.
- [x] 1.4 Implement community hall batch lookup with `committeeRef` population and empty-list short-circuit.
- [x] 1.5 Add repository unit specs for both batch accessors.
- [x] 2.1 Add nullable `currentHallId` / `currentHallName` DTO fields.
- [x] 2.2 Extend `CaregiverMotherResponseDto.fromDomain` with optional current hall metadata.
- [x] 2.3 Add `enrichWithCurrentHalls` batch helper in `CaregiverMotherService`.
- [x] 2.4 Wire enrichment into `findAll()` and `findById()` after AT scope filtering.
- [x] 2.5 Add service unit specs for admin, AT, null fallback, by-id, and AT ordering.
- [x] 3.1 Add frontend nullable current hall fields to `CaregiverMotherResponse`.
- [x] 3.2 Add `Local comunal` table header.
- [x] 3.3 Render `caregiver.currentHallName ?? '-'` in the row body.
- [x] 3.4 Bump empty-state `colspan` from `7` to `8`.
- [x] 3.5 Extend frontend specs for header, fallback dash, and empty-state colspan.
- [x] 4.1 Backend tests/build executed with direct underlying commands; `pnpm test` wrapper is blocked by local `pnpm approve-builds` policy before running tests.
- [x] 4.2 Frontend build and targeted Karma specs passed.
- [x] 4.3 Delta scenarios covered; list enrichment uses one assignment batch query plus one hall batch query.

## TDD Cycle Evidence

| Task | Test File | Layer | Safety Net | RED | GREEN | TRIANGULATE | REFACTOR |
|------|-----------|-------|------------|-----|-------|-------------|----------|
| 1.1–1.2 | `src/infrastructure/database/mongo/repositories/caregiver-hall-assignment-mongo.repository.spec.ts` | Unit | ⚠️ `pnpm test` blocked by local approve-builds policy; direct Jest baseline available after install | ✅ `findCurrentByCaregiverIds` tests failed: method missing | ✅ Direct Jest targeted suite passed | ✅ Active lookup + empty-list short-circuit | ✅ Minimal method placed near assignment write/query methods |
| 1.3–1.4 | `src/infrastructure/database/mongo/repositories/community-hall-mongo.repository.spec.ts` | Unit | N/A (new spec file) | ✅ `findByIds` tests failed: method missing | ✅ Direct Jest targeted suite passed | ✅ Populated result + empty-list short-circuit | ✅ Reused existing `toDomain` mapping |
| 2.1–2.2 | `src/application/dtos/caregiver-attendance/caregiver-mother-response.dto.spec.ts` | Unit | N/A (new spec file) | ✅ DTO tests failed: fields undefined | ✅ Direct Jest targeted suite passed | ✅ Provided hall + omitted hall cases | ✅ Backwards-compatible optional parameter |
| 2.3–2.5 | `src/application/services/caregiver-mother.service.spec.ts` | Unit | ⚠️ `pnpm test` blocked by local approve-builds policy; existing service tests were read before changes | ✅ Service tests failed: current hall metadata undefined | ✅ Direct Jest targeted suite passed | ✅ Admin, AT, null fallback, by-id, and AT-ordering cases | ✅ Private helper keeps batch enrichment isolated |

## Test Summary

- **Total backend tests added**: 10
- **Total frontend tests added**: 2
- **Backend targeted tests**: `jest ...caregiver-hall-assignment... ...community-hall... ...caregiver-mother-response... ...caregiver-mother.service... --runInBand` → 24 passed
- **Backend full tests**: direct `jest --runInBand` → 38 suites, 237 tests passed
- **Backend build**: direct `nest build` → passed
- **Frontend targeted tests**: `ng test --watch=false --browsers=ChromeHeadless --include ...schedules-and-marking.spec.ts --include ...dto-contracts.spec.ts` → 11 passed
- **Frontend build**: `ng build` → passed

## Issues / Notes

- `pnpm test` in the backend currently fails before Jest starts because local pnpm requires `pnpm approve-builds` for ignored dependency build scripts (`@nestjs/core`, `@scarf/scarf`, `bcrypt`, `unrs-resolver`). Direct Jest and Nest CLI commands were used to verify the implementation without changing project package-manager policy.
- Frontend Karma logs a pre-existing font asset 404 for `Montserrat-VariableFont_wght.ttf`; tests still pass.

## Deviations

None — implementation follows the design: current hall remains response-only metadata, no Mongo schemas or domain entities were changed, and frontend scope stayed at interface/template/spec updates.
