# Apply Progress: Caregiver Attendance Verification Fix

## Status

- **applyState**: ready
- **Mode**: Strict TDD
- **Fix target**: CRITICAL verification finding in monthly report caregiver justification matching + pre-archive authorization/package hygiene blockers

## TDD Cycle Evidence

| Task / Finding | RED (test written first) | GREEN (implementation passes) | REFACTOR |
|---|---|---|---|
| Caregiver justification matching in monthly hall report | Added regression test `counts a caregiver justification as a justified absence when no mark exists` to `caregiver-attendance-report.service.spec.ts`; test failed because `appliesToCaregiverBlock('any', 'any', ...)` never matched a real caregiver or date. | Updated `resolveBlockOutcome` to accept `caregiverId` and `localDate` and call `appliesToCaregiverBlock(caregiverId, localDate, block.id)`. Regression test passes. | Replaced `dayRecords[0]?.localDate ?? ''` fallback with the explicit `localDate` parameter for `justified` and `absent` block outcomes. |
| AT scope filtering in `CaregiverMotherService.findAll()` | Added tests: admin returns all caregivers; AT returns only caregivers assigned to accessible halls; AT with no halls returns empty list. Tests failed because `findAll` ignored roles and repository lacked `findByIds`/`findByHallIds`. | Implemented `findByIds` on `CaregiverMotherRepository`, `findByHallIds` on `CaregiverHallAssignmentRepository`, and scoped `findAll` to accessible hall assignments. Tests pass. | Unified pagination by slicing the distinct caregiver-id list before fetching caregivers. |
| AT scope filtering in `CaregiverMotherService.findAssignments()` | Added tests: admin returns all assignments; AT returns only accessible-hall assignments; AT with no accessible assignment is denied. Tests failed because `findAssignments` ignored roles. | Added `roles` parameter, filtered assignments to accessible halls, and threw `UnauthorizedException` when none are within scope. Tests pass. | Reused existing `getAccessibleHallIds` and kept the denial message explicit. |
| Source hall scope check in `CaregiverMotherService.transfer()` | Added tests: AT transfer allowed when both source and destination halls are accessible; denied when source hall is outside scope. Tests failed because only destination hall was checked. | Fetched the caregiver's current assignment and called `ensureCanManageHall` for the source hall before closing it. Tests pass. | Reused `findActiveByCaregiverAndDate` and the existing scope method, skipping the source check only when there is no current assignment. |

## Test Results

- `npx jest --runInBand --silent` — **36 suites passed, 36 total / 226 tests passed, 226 total** (+8 regression tests for scope blockers; previously 218)
- `npx nest build` — **exit 0, no errors**

## Files Changed

| File | Action | Description |
|---|---|---|
| `src/application/services/caregiver-attendance-report.service.ts` | Modified | Fixed `appliesToCaregiverBlock` call to use real `caregiverId` and `localDate`; passed them through `resolveBlockOutcome`. |
| `src/application/services/caregiver-attendance-report.service.spec.ts` | Modified | Added regression test covering caregiver-level justification for a specific date/block in the monthly hall report. |
| `src/application/services/caregiver-mother.service.ts` | Modified | Scoped `findAll` to accessible halls; scoped/denied `findAssignments`; added source hall check in `transfer`. |
| `src/application/services/caregiver-mother.service.spec.ts` | Modified | Added regression tests for AT scope in `findAll`, `findAssignments`, and `transfer`. |
| `src/infrastructure/controllers/caregiver-attendance.controller.ts` | Modified | Pass caller roles to `findAssignments`. |
| `src/domain/repositories/caregiver-mother.repository.ts` | Modified | Added `findByIds(ids: string[])` contract. |
| `src/infrastructure/database/mongo/repositories/caregiver-mother-mongo.repository.ts` | Modified | Implemented `findByIds` using `$in` on `_id`. |
| `src/domain/repositories/caregiver-hall-assignment.repository.ts` | Modified | Added `findByHallIds(hallIds: string[])` contract. |
| `src/infrastructure/database/mongo/repositories/caregiver-hall-assignment-mongo.repository.ts` | Modified | Implemented `findByHallIds` using `$in` on `communityHallId`. |
| `package-lock.json` | Restored | Reverted incidental npm-fallback lockfile drift; `pnpm-lock.yaml` remains the project lockfile. |

## Remaining Risks

- Pre-existing lint noise (~11,700 CRLF-related `prettier/prettier` errors) remains untouched.
- Controller boolean query parsing (`includeExpectedWithoutMarks === 'true'`) remains as a non-blocking suggestion.
- `CaregiverMother.status` redundancy with lifecycle dates remains as a non-blocking suggestion.
