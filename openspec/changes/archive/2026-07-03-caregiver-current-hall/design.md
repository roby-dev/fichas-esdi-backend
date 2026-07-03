# Design: Caregiver Current Hall

## Technical Approach

Expose the caregiver's active Community Hall as response-only metadata. The backend will keep `CaregiverMother` unchanged and enrich `CaregiverMotherResponseDto` from `CaregiverHallAssignment(validTo = null)` plus `CommunityHall.name`. List enrichment must use one batch assignment query and one batch hall query. The frontend only extends the DTO interface and renders the returned `currentHallName` in the existing management table.

## Architecture Decisions

| Decision | Choice | Alternatives considered | Rationale |
|---|---|---|---|
| Response enrichment location | Resolve current hall in `CaregiverMotherService.findAll()` and `findById()` before DTO return | Add fields to `CaregiverMother` entity/schema | Current hall is derived from assignment history, not caregiver identity; keeping the entity unchanged preserves the existing domain model. |
| Batch repository contracts | Add `findCurrentByCaregiverIds(ids)` and `findByIds(ids)` | Loop over `findActiveByCaregiverAndDate` / `findById` | Prevents N+1 and matches the spec requirement of at most two extra queries for any page. |
| Frontend scope | Interface + template only | Add state/service transformations | `CaregiverAttendanceService` already returns typed DTOs and state stores raw responses; extra transformations would add no value. |

## Data Flow

```text
GET /caregiver-attendance/caregivers
  -> CaregiverMotherService.findAll()
  -> caregiverRepository.findAll/findByIds()
  -> assignmentRepository.findCurrentByCaregiverIds(caregiverIds)
  -> hallRepository.findByIds(hallIds)
  -> CaregiverMotherResponseDto.fromDomain(caregiver, currentHall)
  -> Angular table renders currentHallName || '-'
```

For AT-scoped lists, existing hall-scope filtering remains first: accessible halls -> assignments by hall -> caregiver ids -> caregivers. The new enrichment then runs against the returned caregiver ids so the displayed hall reflects the current active assignment.

## File Changes

| File | Action | Description |
|---|---|---|
| `fichas-esdi-backend/src/application/dtos/caregiver-attendance/caregiver-mother-response.dto.ts` | Modify | Add nullable Swagger fields and extend `fromDomain` to accept optional current hall metadata. |
| `fichas-esdi-backend/src/application/services/caregiver-mother.service.ts` | Modify | Add private batch enrichment helper used by `findAll()` and `findById()`. |
| `fichas-esdi-backend/src/domain/repositories/caregiver-hall-assignment.repository.ts` | Modify | Add `findCurrentByCaregiverIds(ids)`. |
| `fichas-esdi-backend/src/infrastructure/database/mongo/repositories/caregiver-hall-assignment-mongo.repository.ts` | Modify | Query `{ caregiverId: { $in }, validTo: null }` with ObjectIds and map to domain. |
| `fichas-esdi-backend/src/domain/repositories/community-hall.repository.ts` | Modify | Add `findByIds(ids)`. |
| `fichas-esdi-backend/src/infrastructure/database/mongo/repositories/community-hall-mongo.repository.ts` | Modify | Query `_id: { $in }`, populate `committeeRef`, map via existing `toDomain`. |
| `fichas-frontend-esdi-2.0/src/app/features/caregiver-attendance/interfaces/caregiver-mother.interface.ts` | Modify | Add `currentHallId` and `currentHallName` nullable response fields. |
| `fichas-frontend-esdi-2.0/src/app/features/caregiver-attendance/pages/components/caregiver-management/caregiver-management.component.html` | Modify | Add `Local comunal` column and change empty-state colspan from 7 to 8. |

## Interfaces / Contracts

```ts
type CurrentHall = { id: string; name: string } | null;

interface CaregiverMotherResponse {
  currentHallId: string | null;
  currentHallName: string | null;
}

interface CaregiverHallAssignmentRepository {
  findCurrentByCaregiverIds(ids: string[]): Promise<CaregiverHallAssignment[]>;
}

interface CommunityHallRepository {
  findByIds(ids: string[]): Promise<CommunityHall[]>;
}
```

Implementation should short-circuit empty id arrays to avoid invalid `$in` ObjectId conversion and unnecessary database calls.

## Testing Strategy

| Layer | What to Test | Approach |
|---|---|---|
| Unit | DTO enrichment, null fields, batch calls for admin and AT paths | Extend `caregiver-mother.service.spec.ts`; update repository mocks with new methods. |
| Repository | Mongo `$in` + `validTo: null` assignment query and `CommunityHall.findByIds` mapping | Extend/add repository specs with mocked chained Mongoose calls. |
| Frontend component | Header/cell rendering, dash fallback, colspan 8 | Extend caregiver management coverage in `caregiver-attendance-schedules-and-marking.spec.ts`. |
| Contract/build | New nullable response fields remain JSON-safe and services stay thin | Update DTO contract fixture; run backend `pnpm test && pnpm build`, frontend targeted Karma/build. |

## Migration / Rollout

No migration required. Existing assignment and hall documents are reused; caregivers without active assignments return null fields.

## Open Questions

None.
