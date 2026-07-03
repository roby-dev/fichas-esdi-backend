# Proposal: Caregiver Current Hall in List Response

## Intent

The caregiver-mother management table does not show which Community Hall each caregiver belongs to. The data already exists via `caregiver_hall_assignments` (one active row per caregiver, identified by `validTo = null`). This change exposes the current hall in the `GET /caregivers` response and renders it in the management UI so AT/admin users can identify each caregiver's hall at a glance.

## Scope

### In Scope
- Backend: extend `CaregiverMotherResponseDto` with `currentHallId` and `currentHallName`; resolve in `findAll()` and `findById()`.
- Backend: add a batch repository method to fetch current assignments for a caregiver list (avoid N+1).
- Frontend: extend the `CaregiverMotherResponse` interface and add a "Local comunal" column to the management table.

### Out of Scope
- New collections, schema migrations, search/filter by hall, create/edit form changes, transfer and report flow changes.

## Capabilities

### New Capabilities
- None

### Modified Capabilities
- `caregiver-attendance` (backend) — list and by-id responses expose the current active hall.
- `caregiver-attendance-frontend` (frontend) — management table renders a "Local comunal" column from the DTO field.

## Approach

**Backend** — add `findCurrentByCaregiverIds(ids: string[]): Promise<CaregiverHallAssignment[]>` to `CaregiverHallAssignmentRepository` (Mongo query: `caregiverId IN ids, validTo: null`). Add `findByIds(ids: string[]): Promise<CommunityHall[]>` to `CommunityHallRepository` (currently missing, needed for batch name resolution). In `CaregiverMotherService.findAll()` and `findById()`: after loading caregivers, fetch current assignments in one call, batch-resolve hall names in one call, attach both to the DTO. Both fields are nullable.

**Frontend** — add `currentHallId: string | null` and `currentHallName: string | null` to `CaregiverMotherResponse`. Insert a `<th>Local comunal</th>` and matching `<td>` (fallback `-`) between "Nombre completo" and "Teléfono" in `caregiver-management.component.html`; bump the empty-state `colspan` from 7 to 8. No service or state shell changes — the seam already returns the DTO.

## Affected Areas

| Area | Impact |
|------|--------|
| `src/domain/repositories/caregiver-hall-assignment.repository.ts` | Add `findCurrentByCaregiverIds` |
| `src/infrastructure/.../caregiver-hall-assignment-mongo.repository.ts` | Implement the new method |
| `src/domain/repositories/community-hall.repository.ts` | Add `findByIds` |
| `src/infrastructure/.../community-hall-mongo.repository.ts` | Implement `findByIds` |
| `src/application/services/caregiver-mother.service.ts` | Wire batch resolution in `findAll`/`findById` |
| `src/application/dtos/.../caregiver-mother-response.dto.ts` | Two new nullable fields + factory signature |
| `src/app/features/caregiver-attendance/interfaces/caregiver-mother.interface.ts` | Two new nullable fields |
| `.../caregiver-management/caregiver-management.component.html` | New column + colspan bump |

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Caregiver with no active assignment (data drift) | Low | Nullable fields; UI shows `-` |
| Hall renamed mid-request | Low | Re-fetched on each list call |
| Empty-state `colspan` mismatch on the new column | Medium | Apply+verify spec scenario covers it explicitly |
| N+1 on the list endpoint | Low | One batch query for assignments + one for hall names, regardless of page size |

## Rollback Plan

Revert the DTO/service/repository changes (backend) and the interface/template changes (frontend). No DB schema changes — rollback is instant and safe.

## Dependencies

None. Both repositories already hold the source data; we only add batch accessors.

## Success Criteria

- `GET /api/v1/caregiver-attendance/caregivers` and `GET /.../caregivers/:id` include `currentHallId` and `currentHallName` (both nullable).
- The management table shows the "Local comunal" column with the hall name, or `-` when null.
- The list endpoint issues at most two extra queries (assignments + halls) regardless of page size.
- Existing create, edit, transfer, and retire flows continue to work unchanged.
